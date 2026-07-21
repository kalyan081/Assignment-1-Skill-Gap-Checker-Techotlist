import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

const MODELS = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.0-flash',
  'gemini-flash-latest'
];
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function safeParseSkillsArray(textRes) {
  if (!textRes) return [];
  let cleanText = textRes.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  try {
    const parsed = JSON.parse(cleanText);
    if (Array.isArray(parsed)) {
      return parsed.map(s => String(s));
    }
    if (parsed && typeof parsed === 'object') {
      const possibleArray = parsed.skills || parsed.languages || parsed.tools || parsed.keywords;
      if (Array.isArray(possibleArray)) {
        return possibleArray.map(s => String(s));
      }
      return Object.values(parsed).filter(v => typeof v === 'string');
    }
  } catch (e) {
    console.warn("JSON parse failed in safeParseSkillsArray, trying regex match:", e.message);
  }
  const matches = cleanText.match(/"([^"\\]|\\.)*"/g);
  if (matches) {
    return matches.map(m => m.slice(1, -1));
  }
  return [];
}

function extractLocalSkills(text) {
  return new Promise((resolve, reject) => {
    // Resolve python via PYTHON_PATH env var, or fall back to system PATH
    const pythonPath = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    const scriptPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'ml', 'scripts', 'extract.py');

    const pyProcess = spawn(pythonPath, [scriptPath]);
    
    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}. Stderr: ${stderrData}`));
        return;
      }
      try {
        const skills = JSON.parse(stdoutData.trim());
        resolve(skills);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${stdoutData}. Error: ${err.message}`));
      }
    });

    pyProcess.on('error', (err) => {
      reject(err);
    });

    // Write input text to stdin
    pyProcess.stdin.write(text);
    pyProcess.stdin.end();
  });
}

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Try extracting with local SpaCy NLP model first!
    try {
      console.log("Attempting local SpaCy NLP skill extraction...");
      const localSkills = await extractLocalSkills(text);
      console.log(`Local SpaCy NLP extraction successful. Found ${localSkills.length} skills.`);
      return NextResponse.json({ skills: localSkills, source: 'local_nlp_model' });
    } catch (localError) {
      console.warn("Local SpaCy NLP extraction failed. Falling back to API/Regex.", localError.message);
    }

    // Fallback 1: Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
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

      for (const model of MODELS) {
        try {
          const response = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textRes) {
              const skills = safeParseSkillsArray(textRes);
              return NextResponse.json({ skills, source: 'gemini_api_fallback' });
            }
          }
        } catch (error) {
          console.warn(`Gemini API Error with ${model}:`, error.message);
        }
      }
    }

    // Fallback 2: Regex-based extraction
    console.warn("Gemini API fallback skipped/failed, using local RegEx fallback parser.");
    
    const FALLBACK_SKILLS = [
      "javascript", "python", "java", "c++", "c#", "ruby", "php", "typescript", "swift", "go", "rust",
      "react", "angular", "vue", "node.js", "express", "django", "flask", "spring", "asp.net",
      "sql", "mysql", "postgresql", "mongodb", "redis", "firebase", "oracle",
      "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", "github", "gitlab",
      "html", "css", "sass", "less", "tailwind", "bootstrap", "material-ui", "figma", "machine learning",
      "data analysis", "agile", "scrum", "jira", "linux", "unix", "bash", "powershell",
      "pytorch", "tensorflow", "keras", "scikit-learn", "langchain", "llm",
      "nlp", "natural language processing", "deep learning", "rag",
      "huggingface", "transformers", "faiss", "spacy", "opencv", "pandas", "numpy"
    ];

    const foundSkills = [];
    const lowerText = text.toLowerCase();
    
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    for (const skill of FALLBACK_SKILLS) {
      if (lowerText.includes(skill)) {
        const regex = new RegExp(`(^|[^a-z0-9])${escapeRegExp(skill)}([^a-z0-9]|$)`, 'i');
        if (regex.test(lowerText)) {
          foundSkills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        }
      }
    }

    if (foundSkills.length === 0) {
      return NextResponse.json({ skills: [], source: 'regex_fallback_empty' });
    }

    return NextResponse.json({ skills: foundSkills, source: 'regex_fallback' });
  } catch (error) {
    console.error('Extract API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
