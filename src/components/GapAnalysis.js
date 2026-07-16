'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function GapAnalysis({ userName, onAnalysisComplete, loadedData }) {
  const [resumeText, setResumeText] = useState(loadedData?.resumeSnippet || '');
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(loadedData?.data || null);
  const [resumeHint, setResumeHint] = useState('Supports PDF, DOCX, TXT');
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  // Load data from history if passed in
  useEffect(() => {
    if (loadedData) {
      setResult(loadedData);
    }
  }, [loadedData]);

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jdText.trim()) {
      setError('Please provide both a resume and a job description.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: resumeText, jd: jdText })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to analyze');
      
      setResult(data);
      onAnalysisComplete(data, resumeText);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (pct) => {
    if (pct >= 80) return 'Excellent Fit';
    if (pct >= 60) return 'Strong Fit';
    if (pct >= 40) return 'Average Fit';
    return 'Weak Fit';
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    setResumeHint('Extracting text...');
    
    try {
      let text = '';
      if (name.endsWith('.pdf')) {
        if (typeof window.pdfjsLib === 'undefined') throw new Error('PDF.js not loaded');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map(item => item.str).join(' '));
        }
        text = pages.join('\n\n');
      } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
        if (typeof window.mammoth === 'undefined') throw new Error('Mammoth.js not loaded');
        const arrayBuffer = await file.arrayBuffer();
        const res = await window.mammoth.extractRawText({ arrayBuffer });
        text = res.value;
      } else if (name.endsWith('.txt') || name.endsWith('.text')) {
        text = await file.text();
      } else {
        setResumeHint('Unsupported format. Use PDF, DOCX, TXT.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      text = text.trim();
      if (!text) {
        setResumeHint('No text extracted.');
      } else {
        setResumeText(text);
        setResumeHint(`${text.length.toLocaleString()} characters extracted`);
      }
    } catch (err) {
      console.error(err);
      setResumeHint(`Error: ${err.message}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section id="view-gap-analysis" className="view-section active">
      <section className="hero" id="heroSection">
        <div className="hero-text">
          <h3 className="hero-greeting user-greeting" id="heroGreeting">Hello, {userName || 'there'}!</h3>
          <p className="hero-tagline">Mapping your path for <span className="accent">Techotlist Assignment -1 Skill Gap Checker</span>.</p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-ghost" id="saveReportBtn" disabled>
            <span className="material-symbols-outlined">download</span>
            Save Report
          </button>
          <button className="btn btn-primary" id="shareBtn" disabled={!result}>
            <span className="material-symbols-outlined">share</span>
            Share Analysis
          </button>
        </div>
      </section>

      <section className="input-grid">
        <div className="input-group">
          <label className="input-label" htmlFor="resumeInput">
            <span className="material-symbols-outlined">description</span>
            Candidate Resume
          </label>
          <div className="input-card neo-pressed" id="resumeCard">
            <textarea
              id="resumeInput"
              placeholder="Paste the candidate's full resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            <div className="input-card-footer">
              <span className="input-card-hint">{resumeHint}</span>
              <button 
                className="icon-btn-sm neo-ext" 
                title="Upload resume (PDF, DOCX, TXT)"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-symbols-outlined">upload_file</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="jdInput">
            <span className="material-symbols-outlined">work</span>
            Job Description
          </label>
          <div className="input-card neo-pressed" id="jdCard">
            <textarea
              id="jdInput"
              placeholder="Paste the job description (JD) here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
            <div className="input-card-footer">
              <span className="input-card-hint">{jdText.length} characters</span>
              <button className="icon-btn-sm neo-ext" title="Clear text" onClick={() => setJdText('')}>
                <span className="material-symbols-outlined">backspace</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="cta-wrapper">
        <button className="btn-analyze" onClick={handleAnalyze} disabled={loading}>
          {loading ? (
            <span><span className="spinner"></span> Analyzing...</span>
          ) : (
            <>
              <span className="material-symbols-outlined">analytics</span>
              <span>Analyze Candidate Fit</span>
            </>
          )}
        </button>
      </div>

      {error && <div style={{ color: 'var(--danger-color)', marginTop: '12px', textAlign: 'center' }}>{error}</div>}

      {result && (
        <section className="results-section visible">
          <div className="results-grid">
            <div className="result-card neo-pressed score-card">
              <h4 className="skills-heading">
                <span className="material-symbols-outlined">speed</span> Role Compatibility
              </h4>
              <div className="ring-container neo-ext">
                <div className="ring-inner neo-pressed">
                  <svg viewBox="0 0 256 256" aria-hidden="true">
                    <circle className="ring-track" cx="128" cy="128" r="110" fill="transparent" stroke="currentColor" strokeWidth="14" />
                    <circle
                      className="ring-progress"
                      cx="128" cy="128" r="110"
                      fill="transparent" stroke="currentColor"
                      strokeWidth="14"
                      strokeDasharray="691.15"
                      strokeDashoffset={691.15 - (result.matchPercentage / 100) * 691.15}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="ring-center">
                    <span className="ring-percentage">{result.matchPercentage}%</span>
                    <span className="ring-label">{getLabel(result.matchPercentage)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="result-card neo-pressed">
              <h4 className="skills-heading match">
                <span className="material-symbols-outlined">check_circle</span> Matched Skills
              </h4>
              <div className="skills-badges">
                {result.matchedSkills?.length === 0 ? (
                  <span className="empty-state">No matching skills found</span>
                ) : (
                  result.matchedSkills?.map((skill, i) => (
                    <span key={i} className="skill-badge match visible">{skill}</span>
                  ))
                )}
              </div>
            </div>

            <div className="result-card neo-pressed">
              <h4 className="skills-heading gap">
                <span className="material-symbols-outlined">error</span> Missing Skills
              </h4>
              <div className="skills-badges">
                {result.missingSkills?.length === 0 ? (
                  <span className="empty-state">No gaps — great match!</span>
                ) : (
                  result.missingSkills?.map((skill, i) => (
                    <span key={i} className="skill-badge gap-skill visible">{skill}</span>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="result-card insight-card neo-pressed" style={{ marginTop: '24px' }}>
            <h4 className="skills-heading">
              <span className="material-symbols-outlined">gavel</span> Fit Verdict
            </h4>
            
            <div style={{ marginBottom: '16px' }}>
              <span className="skill-badge match visible" style={{ 
                fontSize: '16px', 
                padding: '8px 16px',
                background: result.verdict === 'Qualified' ? 'rgba(34, 197, 94, 0.15)' : 
                            result.verdict === 'Almost There' ? 'rgba(245, 158, 11, 0.15)' : 
                            'rgba(239, 68, 68, 0.15)',
                color: result.verdict === 'Qualified' ? '#4ade80' : 
                       result.verdict === 'Almost There' ? '#fbbf24' : 
                       '#f87171',
                border: '1px solid currentColor'
              }}>
                {result.verdict || 'Unknown'}
              </span>
            </div>

            <div className="insight-text" style={{ paddingLeft: '8px' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                {result.reasons?.map((reason, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{reason}</li>
                )) || <li>No reasons provided.</li>}
              </ul>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
