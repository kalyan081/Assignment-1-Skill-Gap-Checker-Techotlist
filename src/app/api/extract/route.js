import { NextResponse } from 'next/server';

const MODELS = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.0-flash',
  'gemini-flash-latest'
];
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function POST(request) {
  try {
    const { text } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured on server' }, { status: 500 });
    }

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
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

    let lastError = null;

    for (const model of MODELS) {
      try {
        const response = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Gemini API Error with ${model}:`, errorText);
          throw new Error(`Google API Error (${model}): ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textRes) throw new Error('No valid response from AI');
        
        let skills = [];
        try {
          skills = JSON.parse(textRes);
        } catch (e) {
          skills = [textRes];
        }

        return NextResponse.json({ skills });
      } catch (error) {
        lastError = error;
      }
    }

    // If we reach here, all models failed
    throw lastError;
  } catch (error) {
    console.error('Extract API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
