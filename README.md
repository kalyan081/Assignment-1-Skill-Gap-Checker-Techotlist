# 🚀 Techotlist Skill & Fit Analyzer (Assignment 1 & 2)

A production-grade, highly optimized, and visually stunning **Next.js Full-Stack Application** built to satisfy the complete requirements for both **Assignment 1 (Skill Gap Checker & standalone Skill Extractor)** and **Assignment 2 (Fit Verdict with reasons)**. 

This single unified application offers a comprehensive dashboard interface to compare candidate resumes against Job Descriptions (JDs), analyze matched/missing skills, and generate AI-driven fit verdicts with structured rationale.

---

## 🔗 Live Application & Code
* **GitHub Repository:** [https://github.com/kalyan081/Assignment-1-Skill-Gap-Checker-Techotlist](https://github.com/kalyan081/Assignment-1-Skill-Gap-Checker-Techotlist)
* **Deployed URL (Vercel):** [https://stitch-ai-skill-gap-checker-techotlist.vercel.app/](https://stitch-ai-skill-gap-checker-techotlist.vercel.app/)

---

## 🛠️ Complete Feature Walkthrough

This application is split into three main modules, making it exceptionally easy for evaluators to review the requirements:

### 1. The Dashboard (Overview & Leaderboard)
* **Avg Match Score Tracking:** Shows the running average compatibility score of all candidates analyzed.
* **Top Candidate Sorting:** The dashboard history list is dynamically sorted by **highest Match Score first** (descending order). This acts as a leaderboard, allowing recruiters to see the top-matching applicants at a glance.
* **Analysis Deletion & Reloading:** Allows quick reloading of any past analysis card back into the playground or permanent deletion from the local browser storage.

### 2. Gap Analysis & Fit Verdict (Assignment 1 & 2 Combined)
* **Smart File Uploads:** Supports direct parsing of `.pdf`, `.docx`, and `.txt` files directly in the browser—no text copying needed.
* **Interactive Score Ring:** A glowing, custom-designed Neumorphic SVG percentage ring that dynamically calculates role compatibility.
* **Identified Gaps (Assignment 1):** Side-by-side comparison of **Core Strengths** (Matched Skills) and **Identified Gaps** (Missing Skills) categorized as clean visual badges.
* **Fit Verdict (Assignment 2):** Uses a cascading AI inference loop to output a definitive verdict: **Qualified** (green), **Almost There** (amber), or **Not Yet** (red).
* **Concise Supporting Reasons (Assignment 2):** Displays exactly **three concise, bulleted explanations** outlining the verdict based on the match percentage and missing core stack elements.

### 3. Standalone Skill Extraction (Assignment 1 Helper)
* Standalone tool to drop any text or upload a document and instantly extract structured lists of technical skills without requiring comparison to a job description.
* Shares text dynamically with the Gap Analysis view so switching between tabs keeps your uploaded document loaded.

---

## ⚙️ Setup Instructions

Follow these exact steps to run the project locally on your machine in under 2 minutes:

### 1. Prerequisites
Ensure you have the following installed:
* **Node.js** (v18.x or higher is recommended)
* **npm** (comes packaged with Node.js)
* **Google Gemini API Key** (Get a free key from [Google AI Studio](https://aistudio.google.com/apikey))

### 2. Download and Enter Project
Clone the repository using Git or download and unzip the folder:
```bash
git clone https://github.com/kalyan081/Assignment-1-Skill-Gap-Checker-Techotlist.git
cd stitch_ai_skill_gap_analyzer
```

### 3. Install Dependencies
Run the command below to install all Next.js, React, and file parsing packages (`pdfjs-dist`, `mammoth`):
```bash
npm install
```

### 4. Setup Your API Key (Critical Step 🔑)
Create a new file in the root directory named `.env.local` and paste your API key inside:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
> ⚠️ **DO NOT** commit `.env.local` to GitHub. The project's `.gitignore` is already set up to exclude it, ensuring your API key remains private.

### 5. Start the App
Start the local development server:
```bash
npm run dev
```

### 6. Access in Browser
Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 💡 Engineering Assumptions & Fallback Design

* **Zero-Outage Local Fallback Engine:** Google's free-tier Gemini API occasionally returns `503 (Service Unavailable)` errors during high global demand. To make sure this app **never crashes** during evaluation, we implemented a smart fallback. If Google's servers time out or fail, the app immediately switches to a **Local Regex-Based Parsing Engine** matching against a dictionary of 50+ modern technologies (React, Node, Docker, etc.) and calculates the fit verdict programmatically so the UI remains fully functional.
* **Cascading Model Pipeline:** The API router implements a cascading fallback loop. It starts with the newest models (`gemini-3.5-flash`) and cascades down through fallback configurations (`gemini-3-flash-preview` -> `gemini-2.0-flash` -> `gemini-flash-latest`) to bypass rate limits or model deprecations.
* **Deterministic Skill Matching:** Rather than relying on creative AI to match lists, matching is done programmatically using case-insensitive normalization. This ensures matching percentages are mathematically exact.

---

## ⚖️ Architecture Trade-offs

1. **Client-Side Document Parsing (Mammoth.js & PDF.js):** 
   * *Trade-off:* We parse resumes directly in the user's browser instead of uploading them to a backend server. 
   * *Why?* This guarantees total data privacy for candidates, reduces hosting costs, and removes backend file storage dependency, although it increases the page's initial bundle size slightly.
2. **Vanilla Neumorphic CSS vs. Tailwind:** 
   * *Trade-off:* We built a complete custom design system using pure CSS variable tokens instead of standard Tailwind utility classes.
   * *Why?* Neumorphic design (soft shadows, inset curves, and glowing rings) requires highly precise shadow styling, transitions, and hover effects that are cleaner to organize, modify, and audit in standard CSS variables.
3. **LocalStorage for History Storage:** 
   * *Trade-off:* Past reports are persisted inside the browser's `localStorage` rather than setting up an external PostgreSQL/MongoDB database.
   * *Why?* This makes the project completely zero-config and self-contained for evaluators, eliminating the need to set up local database servers or configure complex database credentials to test history features.
