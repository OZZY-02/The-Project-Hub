import { NextResponse } from 'next/server';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  if (!OPENAI_KEY) return NextResponse.json({ error: 'Missing AI key' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Missing body' }, { status: 400 });

  const intake = body.intake || body;
  const language = (intake?.language || 'en').startsWith('ar') ? 'ar' : 'en';

  const systemPrompt = `You are a portfolio generator. Given the JSON intake, produce a JSON object matching this schema exactly (no extra text):
{
  "title": "", 
  "subtitle": "",
  "about": "",
  "projects": [{ "id":"", "title":"","blurb":"","bullets":[] }],
  "skills_paragraph": "",
  "tools_paragraph": "",
  "call_to_action": "",
  "seo_description": "",
  "language": "en"
}

Return only the JSON. Keep text concise (1-3 sentences per field), and generate content in the requested language (${language}).`;

  const userPrompt = `Intake JSON:\n${JSON.stringify(intake)}\nTone: friendly, concise.`;

  try {
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.7,
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ error: 'AI provider error', detail: txt }, { status: 502 });
    }

    const j = await resp.json();
    const assistant = j.choices?.[0]?.message?.content || '';

    // Try parse JSON strictly, but allow extracting substring if needed
    let generated = null;
    try {
      generated = JSON.parse(assistant);
    } catch (e) {
      const first = assistant.indexOf('{');
      const last = assistant.lastIndexOf('}');
      if (first !== -1 && last !== -1) {
        const sub = assistant.slice(first, last + 1);
        try { generated = JSON.parse(sub); } catch (err) { /* fallthrough */ }
      }
    }

    if (!generated) return NextResponse.json({ error: 'AI did not return valid JSON', raw: assistant }, { status: 500 });

    return NextResponse.json({ generated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', detail: String(err) }, { status: 500 });
  }
}
