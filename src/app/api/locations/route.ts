import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request) {
  try {
    const dataPath = path.join(process.cwd(), 'src', 'data', 'countries.json');
    const raw = await fs.readFile(dataPath, 'utf8');
    const json = JSON.parse(raw) as Record<string, string[]>;

    const url = new URL(req.url);
    const country = url.searchParams.get('country');

    if (country) {
      const cities: string[] = Array.isArray(json[country]) ? json[country] : [];
      // sort alphabetically
      cities.sort((a: string, b: string) => a.localeCompare(b));
      return NextResponse.json({ country, cities });
    }

    // Return list of countries (exclude Israel if present)
    const countries = Object.keys(json).filter((n) => n !== 'Israel');
    if (!countries.includes('Palestine')) countries.unshift('Palestine');
    countries.sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ countries });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load locations' }, { status: 500 });
  }
}
