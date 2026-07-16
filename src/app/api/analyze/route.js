import { NextResponse } from 'next/server';

const MODELS = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.0-flash',
  'gemini-flash-latest'
];
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function extractSkills(text, apiKey) {
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

      return JSON.parse(textRes);
    } catch (error) {
      lastError = error;
      // If it's a model-specific error or 503/404/429, we'll loop to the next one.
      // If we exhaust all models, it will throw the last error outside the loop.
    }
  }

  throw lastError;
}

export async function POST(request) {
  try {
    const { resume, jd } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured on server' }, { status: 500 });
    }

    if (!resume || !jd) {
      return NextResponse.json({ error: 'Missing resume or job description' }, { status: 400 });
    }

    // 1. Extract skills from Resume
    const resumeSkills = await extractSkills(resume, apiKey);
    // 2. Extract skills from JD
    const jdSkills = await extractSkills(jd, apiKey);

    // 3. Standardize and Compare programmatically
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const resumeNormalized = resumeSkills.map(s => ({ raw: s, norm: normalize(s) }));
    const jdNormalized = jdSkills.map(s => ({ raw: s, norm: normalize(s) }));

    const matchedSkills = [];
    const missingSkills = [];

    jdNormalized.forEach(jdSkill => {
      const isMatch = resumeNormalized.some(rSkill => rSkill.norm === jdSkill.norm);
      if (isMatch) {
        matchedSkills.push(jdSkill.raw);
      } else {
        missingSkills.push(jdSkill.raw);
      }
    });

    // 4. Calculate percentage
    const totalJD = jdSkills.length;
    let matchPercentage = 0;
    if (totalJD > 0) {
      matchPercentage = Math.round((matchedSkills.length / totalJD) * 100);
    }

    // 5. Assignment 2: Use AI to get Fit Verdict and 3 Reasons
    let verdict = 'Not Yet';
    let reasons = ['Analysis failed.', '', ''];
    let strategicInsight = '';

    if (totalJD > 0) {
      const verdictPrompt = `Based on the following skill gap analysis for a candidate:
Matched Skills: ${matchedSkills.join(', ') || 'None'}
Missing Skills: ${missingSkills.join(', ') || 'None'}
Match Percentage: ${matchPercentage}%

Provide a hiring verdict and exactly 3 concise reasons supporting the verdict.
The verdict MUST be exactly one of: "Qualified", "Almost There", or "Not Yet".
Return ONLY a valid JSON object with this exact structure:
{
  "verdict": "Almost There",
  "reasons": [
    "Reason 1...",
    "Reason 2...",
    "Reason 3..."
  ]
}
No markdown fences.`;

      const vPayload = {
        contents: [{ parts: [{ text: verdictPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      };

      const vResponse = await fetch(`${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vPayload)
      });

      if (vResponse.ok) {
        const vData = await vResponse.json();
        const vText = vData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (vText) {
          const vJson = JSON.parse(vText);
          verdict = vJson.verdict;
          reasons = vJson.reasons;
          strategicInsight = reasons.join(' ');
        }
      }
    } else {
      strategicInsight = 'No skills found in Job Description.';
      reasons = ['No JD skills found.', '', ''];
    }

    return NextResponse.json({
      matchPercentage,
      matchedSkills,
      missingSkills,
      strategicInsight,
      verdict,
      reasons
    });
  } catch (error) {
    console.error('Analyze API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
