# SkillLens — AI Skill Gap Analyzer

An AI-powered tool that analyzes a candidate's resume against a job description to identify matched skills, skill gaps, and provide strategic hiring insights.

![SkillLens](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-6366f1?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/status-Production-10b981?style=flat-square)

## Features

- **AI-Powered Analysis** — Uses Google Gemini 2.0 Flash to extract and compare technical skills
- **Visual Match Score** — Animated SVG progress ring showing role compatibility percentage
- **Skill Categorization** — Clearly identifies matched skills (strengths) and missing skills (gaps)
- **Strategic Insight** — AI-generated narrative with specific recommendations
- **Light/Dark Mode** — Neomorphic design system with theme toggle and persistence
- **Analysis History** — Saves last 10 analyses with load/delete capability
- **Export** — Save reports as JSON, share via clipboard
- **Responsive** — Fully responsive from mobile to desktop
- **Zero Build Step** — Pure HTML/CSS/JS, open directly in browser

## Project Structure

```
stitch_ai_skill_gap_analyzer/
├── index.html          # Main HTML (semantic, accessible)
├── css/
│   └── styles.css      # Complete design system (light/dark tokens)
├── js/
│   ├── theme.js        # Theme toggle (light/dark + localStorage)
│   ├── ui.js           # UI utilities (toasts, modal, mobile menu)
│   ├── api.js          # Gemini API service (prompt + fetch + parse)
│   └── app.js          # App controller (orchestration, history, export)
└── README.md
```

## Getting Started

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the key

### 2. Open the App

Simply open `index.html` in any modern browser (Chrome, Edge, Firefox).

### 3. Configure

1. Click the **⚙ Settings** icon in the header
2. Paste your API key
3. Click **Save Key**

### 4. Analyze

1. Paste a candidate's resume in the left textarea
2. Paste a job description in the right textarea
3. Click **"Analyze Candidate Fit"** (or press `Ctrl + Enter`)

## How It Works

1. **Extraction** — Gemini identifies all technical skills, languages, frameworks, tools, and platforms from both texts
2. **Normalization** — Skill names are standardized (e.g., "React.js" → "React", "k8s" → "Kubernetes")
3. **Comparison** — Skills are categorized as matched or missing
4. **Scoring** — Match percentage = (Matched Skills / Total JD Skills) × 100
5. **Insight** — AI generates a strategic assessment with specific recommendations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | Semantic HTML5 |
| Styling | Vanilla CSS (Custom Properties, Neomorphism) |
| Logic | Vanilla JavaScript (Module Pattern) |
| AI | Google Gemini 2.0 Flash (REST API) |
| Fonts | Manrope (Google Fonts) |
| Icons | Material Symbols |

## Privacy

- API key is stored **only** in your browser's `localStorage`
- No data is sent to any server other than Google's Gemini API
- Analysis history is stored locally in your browser

## License

MIT
