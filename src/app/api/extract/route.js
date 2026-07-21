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

function extractLocalSkills(text) {
  return new Promise((resolve, reject) => {
    // Path to the python executable in the collage-projects environment
    // Built dynamically to prevent Next.js static tracing from copying the conda directory
    const condaBase = ['C:', 'Users', 'Admin', 'miniconda3', 'envs', 'project-assignments'].join(path.sep);
    const pythonPath = process.env.PYTHON_PATH || path.join(condaBase, 'python.exe');
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
              let skills = [];
              try {
                skills = JSON.parse(textRes);
              } catch (e) {
                skills = [textRes];
              }
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
      "data analysis", "agile", "scrum", "jira", "linux", "unix", "bash", "powershell"
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
      return NextResponse.json({ skills: ["JavaScript", "HTML", "CSS"], source: 'regex_fallback_default' });
    }

    return NextResponse.json({ skills: foundSkills, source: 'regex_fallback' });
  } catch (error) {
    console.error('Extract API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
