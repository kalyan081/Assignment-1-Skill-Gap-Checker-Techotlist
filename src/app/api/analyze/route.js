import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import * as ort from 'onnxruntime-node';

const MODELS = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.0-flash',
  'gemini-flash-latest'
];
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

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

async function predictFitONNX(matchPercentage, matchedCount, missingCount) {
  try {
    const modelPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'ml', 'models', 'fit_classifier.onnx');
    const session = await ort.InferenceSession.create(modelPath);
    
    const data = Float32Array.from([matchPercentage, matchedCount, missingCount]);
    const inputTensor = new ort.Tensor('float32', data, [1, 3]);
    
    const feeds = { input: inputTensor };
    const results = await session.run(feeds);
    const outputTensor = results.output;
    const outputData = outputTensor.data;
    
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < outputData.length; i++) {
      if (outputData[i] > bestVal) {
        bestVal = outputData[i];
        bestIdx = i;
      }
    }
    
    const categories = ["Not Yet", "Almost There", "Qualified"];
    return categories[bestIdx];
  } catch (e) {
    console.error("ONNX Inference failed:", e);
    if (matchPercentage >= 75) return "Qualified";
    if (matchPercentage >= 40) return "Almost There";
    return "Not Yet";
  }
}

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
        const status = response.status;
        const errorText = await response.text();
        console.warn(`Gemini API Error with ${model}:`, errorText);
        if (status === 401 || status === 400) {
          // Non-retryable — fail fast instead of trying remaining models
          throw new Error(`Non-retryable error (${status}): ${errorText}`);
        }
        throw new Error(`Google API Error (${model}): ${status} - ${errorText}`);
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

  // If we reach here, AI failed. Let's use a local fallback so the user is never blocked!
  console.warn("AI extraction failed, using local RegEx fallback parser.");
  
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
      // Robust boundary check that works for C++ and Node.js
      const regex = new RegExp(`(^|[^a-z0-9])${escapeRegExp(skill)}([^a-z0-9]|$)`, 'i');
      if (regex.test(lowerText)) {
        // Capitalize nicely
        foundSkills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    }
  }

  // Return empty array honestly if nothing matched
  if (foundSkills.length === 0) {
    return [];
  }

  return foundSkills;
}

export async function POST(request) {
  try {
    const { resume, jd } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!resume || !jd) {
      return NextResponse.json({ error: 'Missing resume or job description' }, { status: 400 });
    }

    // 1. Extract skills from Resume (local first, then fallback)
    let resumeSkills;
    try {
      console.log("Attempting local SpaCy NLP extraction for resume...");
      resumeSkills = await extractLocalSkills(resume);
      console.log(`Local SpaCy NLP extraction successful for resume. Found ${resumeSkills.length} skills.`);
    } catch (err) {
      console.warn("Local resume extraction failed, falling back to Gemini API / Regex. Error:", err.message);
      resumeSkills = await extractSkills(resume, apiKey);
    }

    // 2. Extract skills from JD (local first, then fallback)
    let jdSkills;
    try {
      console.log("Attempting local SpaCy NLP extraction for JD...");
      jdSkills = await extractLocalSkills(jd);
      console.log(`Local SpaCy NLP extraction successful for JD. Found ${jdSkills.length} skills.`);
    } catch (err) {
      console.warn("Local JD extraction failed, falling back to Gemini API / Regex. Error:", err.message);
      jdSkills = await extractSkills(jd, apiKey);
    }

    // 3. Dedup and standardize skills
    const SYNONYMS = {
      'reactjs': 'react', 'react.js': 'react',
      'ml': 'machinelearning',
      'js': 'javascript',
      'nodejs': 'nodejs', 'node': 'nodejs',
      'py': 'python',
    };
    const normalize = (str) => {
      const base = str.toLowerCase().replace(/[^a-z0-9. ]/g, '').trim();
      return SYNONYMS[base] || base.replace(/[^a-z0-9]/g, '');
    };

    // Dedup extracted skills before comparison
    resumeSkills = [...new Set(resumeSkills.map(s => s.trim()))];
    jdSkills = [...new Set(jdSkills.map(s => s.trim()))];
    
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
    let onnxVerdict = 'Not Yet';

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

      let vText = null;
      for (const model of MODELS) {
        try {
          const vResponse = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vPayload)
          });

          if (vResponse.ok) {
            const vData = await vResponse.json();
            vText = vData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (vText) break;
          }
        } catch (e) {
          // ignore and try next model
        }
      }

      // Use ONNX fit classifier to get verdict prediction
      onnxVerdict = "Not Yet";
      try {
        onnxVerdict = await predictFitONNX(matchPercentage, matchedSkills.length, missingSkills.length);
      } catch (e) {
        console.error("ONNX fit prediction failed:", e);
      }

      if (vText) {
        try {
          const vJson = JSON.parse(vText);
          // Validate verdict is strictly one of the allowed values
          const ALLOWED_VERDICTS = ['Qualified', 'Almost There', 'Not Yet'];
          if (ALLOWED_VERDICTS.includes(vJson.verdict)) {
            verdict = vJson.verdict;
          } else {
            console.warn(`AI returned invalid verdict "${vJson.verdict}", falling back to ONNX.`);
            verdict = onnxVerdict;
          }
          reasons = Array.isArray(vJson.reasons) ? vJson.reasons.slice(0, 3) : reasons;
          strategicInsight = reasons.join(' ');
        } catch (e) {
          console.error("Failed to parse verdict JSON:", e);
        }
      } else {
        console.warn("AI verdict failed or disabled, using local offline ONNX verdict calculation.");
        verdict = onnxVerdict;
        if (verdict === "Qualified") {
          reasons = [
            "Model predicted high compatibility based on matched skills.",
            "Strong alignment with job description requirements.",
            "Recommended for interview."
          ];
        } else if (verdict === "Almost There") {
          reasons = [
            "Model predicted moderate compatibility.",
            "Candidate matches several key skills but has some gaps.",
            "Consider training or secondary review."
          ];
        } else {
          reasons = [
            "Model predicted low compatibility based on current match.",
            "Significant gaps in required technical skills.",
            "Not recommended at this stage."
          ];
        }
        strategicInsight = reasons.join(' ');
      }
    } else {
      strategicInsight = 'No skills found in Job Description.';
      reasons = ['No JD skills found.', '', ''];
    }

    const predictedRole = `ONNX Fit Model predicted: ${onnxVerdict}`;

    return NextResponse.json({
      matchPercentage,
      matchedSkills,
      missingSkills,
      strategicInsight,
      verdict,
      reasons,
      predictedRole
    });
  } catch (error) {
    console.error('Analyze API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
