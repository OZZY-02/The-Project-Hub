import { NextResponse } from 'next/server';
import { isSafeRemoteUrl } from '@/lib/request-security';

// Server-side thumbnail generator for resume URLs.
// Query params:
//  - url: encoded URL to fetch (required)
// Example: /api/resume/thumbnail?url=https%3A%2F%2Fexample.com%2Fresume.pdf

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });
  if (!isSafeRemoteUrl(url)) return new NextResponse('Unsupported url', { status: 400 });

  try {
    const fetched = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    });
    if (!fetched.ok) return new NextResponse('Failed to fetch remote file', { status: 502 });
    const contentType = fetched.headers.get('content-type') || '';
    const arrayBuffer = await fetched.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If it's already an image, just return it
    if (contentType.startsWith('image/')) {
      const uint = new Uint8Array(buffer);
      return new NextResponse(uint, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    // If PDF, attempt to rasterize first page to PNG using pdfjs + canvas
    if (contentType.includes('pdf') || /\.pdf(\?|$)/i.test(url)) {
      try {
        // Dynamically import server-friendly pdfjs build
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
        // Import node-canvas for server drawing
        const { createCanvas } = await import('canvas');

        const loadingTask = pdfjs.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        const ctx = canvas.getContext('2d');

        // pdfjs page render expects a canvas context compatible object
        await page.render({ canvasContext: ctx as never, viewport }).promise;
        const pngBuffer = canvas.toBuffer('image/png');
        const pngUint = new Uint8Array(pngBuffer);
        return new NextResponse(pngUint, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      } catch (err) {
        console.warn('Server-side PDF render failed', err);
        // Fallback: proxy original PDF so client can still open it in iframe
        const pdfUint = new Uint8Array(buffer);
        return new NextResponse(pdfUint, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    }

    // Fallback: return raw bytes with detected content-type or octet-stream
    const rawUint = new Uint8Array(buffer);
    return new NextResponse(rawUint, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (err) {
    console.error('Thumbnail generation error', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export const runtime = 'nodejs';
