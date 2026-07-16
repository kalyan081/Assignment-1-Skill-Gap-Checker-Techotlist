import { NextResponse } from 'next/server';

const MODEL = 'gemini-flash-latest';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function POST(request) {
  try {
    const { missingSkills } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured on server' }, { status: 500 });
    }

    if (!missingSkills || !Array.isArray(missingSkills) || missingSkills.length === 0) {
      return NextResponse.json({ error: 'Missing skills array' }, { status: 400 });
    }

    const prompt = `You are an expert technical mentor. Generate a concise, practical 3-step learning path for someone missing the following skills: ${missingSkills.join(', ')}.
Format the response in Markdown. Use headings, bullet points, and bold text. Keep it actionable and under 300 words.`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
      }
    };

    const response = await fetch(`${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to generate learning path');
    }

    const data = await response.json();
    const markdown = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!markdown) {
      throw new Error('No valid response from AI');
    }

    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Learning Path API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
