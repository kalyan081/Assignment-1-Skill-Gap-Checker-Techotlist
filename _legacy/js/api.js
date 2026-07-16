/**
 * api.js — Gemini API service for skill gap analysis
 *
 * Exports: GeminiAPI.analyze(resumeText, jdText) → Promise<AnalysisResult>
 *
 * AnalysisResult shape:
 * {
 *   matchedSkills: string[],
 *   missingSkills: string[],
 *   matchPercentage: number,
 *   strategicInsight: string
 * }
 */

const GeminiAPI = (() => {

  const MODEL = 'gemini-flash-latest';
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  const SYSTEM_PROMPT = `You are an elite technical recruiter and highly precise AI data-extraction engine called "SkillLens".

Your task is to analyze a candidate's Resume and a Job Description (JD), extract the core technical skills from both, and compare them to determine the candidate's fit.

INSTRUCTIONS:
1. Extract Skills: Identify ALL technical skills, programming languages, frameworks, tools, libraries, databases, cloud platforms, methodologies (Agile, Scrum, CI/CD), and certifications mentioned in both the Resume and the Job Description. IGNORE soft skills (e.g., "teamwork", "communication", "leadership").
2. Standardize: Normalize the skill names to ensure accurate comparison. Examples:
   - "React.js", "ReactJS", "React" → "React"
   - "Node.js", "Node", "NodeJS" → "Node.js"
   - "Amazon Web Services", "AWS" → "AWS"
   - "PostgreSQL", "Postgres" → "PostgreSQL"
   - "k8s", "Kubernetes" → "Kubernetes"
   - "ML", "Machine Learning" → "Machine Learning"
3. Compare:
   - matchedSkills: Skills present in BOTH the Resume and the JD.
   - missingSkills: Skills required in the JD but NOT found in the Resume.
4. Calculate matchPercentage: Use the exact formula: (Number of Matched Skills / Total Number of unique JD Skills) * 100. Round to the nearest whole number.
5. Strategic Insight: Write a 2-3 sentence professional assessment. Mention the candidate's strongest area, the most critical gap(s), and a specific recommendation. Wrap key technical terms in **double asterisks** for emphasis.
6. Output Format: You MUST respond with ONLY a valid JSON object. No markdown fencing, no explanation, no text before or after the JSON.

REQUIRED JSON SCHEMA:
{
  "matchedSkills": ["Skill 1", "Skill 2"],
  "missingSkills": ["Skill 3", "Skill 4"],
  "matchPercentage": 60,
  "strategicInsight": "The candidate demonstrates strong expertise in..."
}`;

  /**
   * Perform gap analysis by extracting skills separately, then comparing them.
   * @param {string} resumeText 
   * @param {string} jdText 
   * @returns {Promise<Object>}
   */
  async function analyze(resumeText, jdText) {
    // 1. Extract skills from Resume
    const resumeSkills = await extractSkills(resumeText);
    // 2. Extract skills from JD
    const jdSkills = await extractSkills(jdText);

    // 3. Standardize and Compare programmatically
    // Helper to normalize strings for comparison (e.g. "Node.js" -> "nodejs")
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const resumeNormalized = resumeSkills.map(s => ({ raw: s, norm: normalize(s) }));
    const jdNormalized = jdSkills.map(s => ({ raw: s, norm: normalize(s) }));

    const matchedSkills = [];
    const missingSkills = [];

    // Find matches and missing skills based on the JD
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

    // 5. Generate a quick strategic insight (Optional, but keeps the UI working as before)
    let strategicInsight = 'No insights available.';
    if (totalJD > 0) {
       if (matchPercentage >= 70) {
         strategicInsight = `Strong candidate! They possess ${matchedSkills.length} out of ${totalJD} required skills. Recommend moving forward with an interview.`;
       } else if (matchPercentage >= 40) {
         strategicInsight = `Average fit. They have core skills but are missing ${missingSkills.join(', ')}. Training may be required.`;
       } else {
         strategicInsight = `Weak fit. Missing significant required skills. Look for other candidates unless they show high adaptability.`;
       }
    }

    return {
      matchPercentage,
      matchedSkills,
      missingSkills,
      strategicInsight
    };
  }

  /**
   * Generates a learning path based on missing skills.
   * @param {string[]} missingSkills
   * @returns {Promise<string>} Markdown text of the learning path
   */
  async function generateLearningPath(missingSkills) {
    const apiKey = 'YOUR_API_KEY_HERE';

    const prompt = `You are an expert technical mentor. Generate a concise, practical 3-step learning path for someone missing the following skills: ${missingSkills.join(', ')}.
Format the response in Markdown. Use headings, bullet points, and bold text. Keep it actionable and under 300 words.`;

    const url = `${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to generate learning path');
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No learning path generated.';
  }

  /**
   * Extracts skills from a single block of text.
   * @param {string} text
   * @returns {Promise<string[]>} Array of skills
   */
  async function extractSkills(text) {
    const apiKey = 'YOUR_API_KEY_HERE';

    const prompt = `Extract all technical skills, programming languages, and tools from the text below. 
Return ONLY a valid JSON array of strings, like ["React", "Python"]. No markdown fences.
Text: ${text}`;

    const url = `${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to extract skills');
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return _parseJSON(raw);
  }

  /**
   * Parses JSON from potentially markdown-wrapped text.
   */
  function _parseJSON(raw) {
    // Strip markdown code fences if present
    let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      // Fallback: find first JSON object
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error('Failed to parse API response as JSON.');
    }
  }

  return { analyze, generateLearningPath, extractSkills };
})();
