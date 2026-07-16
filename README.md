# Techotlist Assignment -1 Skill Gap Checker

A modern, AI-powered Next.js application that evaluates a candidate's fit for a role based on their resume and a Job Description. This project fulfills the requirements for **Assignment 1 (Skill Gap Checker)** and **Assignment 2 (Fit Verdict)**.

## Features Completed
- **Assignment 1 (Skill Gap Checker):** Extracts technical skills from both the Resume and Job Description using Google Gemini API. Calculates Match Percentage, Matched Skills, and Missing Skills.
- **Assignment 2 (Fit Verdict):** Uses AI to generate a definitive Fit Verdict ("Qualified", "Almost There", or "Not Yet") and provides 3 concise reasons supporting the decision.
- **File Parsing:** Native support for extracting text from `.pdf`, `.docx`, and `.txt` files directly in the browser using `pdf.js` and `mammoth.js`.
- **Modern Tech Stack:** Built with Next.js App Router (React) and raw CSS for a fast, responsive, and beautiful Neumorphic UI. 

## Setup Instructions

### Prerequisites
- Node.js 18.x or higher
- A Google Gemini API Key

### Local Development
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd stitch_ai_skill_gap_analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Assumptions
- **AI Model Selection:** The `gemini-1.5-flash-latest` model is used for fast, structured JSON generation. 
- **Skill Matching Logic:** Skill extraction is handled by AI to capture variations, but the actual matching is done programmatically (case-insensitive string comparison after alphanumeric normalization) to ensure deterministic percentage calculation.
- **Verdict Generation:** To save tokens and reduce latency, the second AI prompt for Assignment 2 only evaluates the extracted `Matched Skills` and `Missing Skills` to determine the Fit Verdict, rather than reprocessing the entire raw resume and JD.

## Trade-offs Made
- **CSS Framework:** While TailwindCSS is standard in Next.js, this project uses a highly customized global Vanilla CSS file to achieve a specific "dark mode glass/neumorphic" aesthetic. This gives greater control over complex micro-animations and gradients but sacrifices some component-level CSS modularity.
- **Client-Side Parsing:** PDF and DOCX files are parsed entirely on the client side (using `pdf.js` and `mammoth.js`) rather than uploading the file to a server. This improves data privacy and reduces server costs but requires loading heavier scripts on the frontend.
- **State Management:** React `useState` is used instead of a robust state manager like Redux since the application state is relatively flat and localized.

## Deployment
This project is fully optimized for deployment on Vercel. 
Simply push the repository to GitHub, link the repository in Vercel, and ensure you add the `GEMINI_API_KEY` to your Vercel Environment Variables before deploying.
