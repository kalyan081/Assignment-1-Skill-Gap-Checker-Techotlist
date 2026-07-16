import { NextResponse } from 'next/server';

const MODEL = 'gemini-1.5-flash-latest';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function POST(request) {
  try {
    const { text } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured on server' }, { status: 500 });
    }

    if (!text) {
      return NextResponse.json({ error: 'Missing text to extract skills from' }, { status: 400 });
    }

    const prompt = `Extract all technical skills, programming languages, and tools from the text below. 
Return ONLY a valid JSON array of strings, like ["React", "Python"]. No markdown fences.
Text:
${text}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(`${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      throw new Error(`Google API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textRes) {
      throw new Error('No valid response from AI');
    }

    const skills = JSON.parse(textRes);
    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Extract API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
