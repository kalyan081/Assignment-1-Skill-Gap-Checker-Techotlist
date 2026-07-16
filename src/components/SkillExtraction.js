'use client';

import React, { useState, useRef } from 'react';

export default function SkillExtraction({ sharedText, setSharedText }) {
  const [skills, setSkills] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resumeHint, setResumeHint] = useState('Supports PDF, DOCX, TXT');
  const fileInputRef = useRef(null);

  const handleExtract = async () => {
    if (!sharedText.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sharedText })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to extract skills');
      
      setSkills(data.skills);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        setSharedText(text);
        setResumeHint(`${text.length.toLocaleString()} characters extracted`);
      }
    } catch (err) {
      console.error(err);
      setResumeHint(`Error: ${err.message}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section id="view-skill-analysis" className="view-section active">
      <div className="hero">
        <div className="hero-text">
          <h3 className="hero-greeting">Skill Extraction</h3>
          <p className="hero-tagline">Extract and categorize technical skills from any document or text.</p>
        </div>
      </div>
      <div className="input-card neo-pressed" style={{ marginTop: '24px' }}>
        <textarea 
          placeholder="Paste a resume, job description, or any text here..." 
          style={{ minHeight: '200px', width: '100%', background: 'transparent', border: 'none', color: 'inherit', resize: 'vertical', outline: 'none' }}
          value={sharedText}
          onChange={(e) => setSharedText(e.target.value)}
        />
        <div className="input-card-footer">
          <span className="input-card-hint">{resumeHint}</span>
          <button 
            className="icon-btn-sm neo-ext" 
            title="Upload document (PDF, DOCX, TXT)"
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
      <div className="cta-wrapper" style={{ marginTop: '24px' }}>
        <button className="btn-analyze" onClick={handleExtract} disabled={loading || !sharedText.trim()}>
          {loading ? (
            <span><span className="spinner"></span> Extracting...</span>
          ) : (
            <>
              <span className="material-symbols-outlined">auto_awesome</span>
              <span>Extract Skills</span>
            </>
          )}
        </button>
      </div>

      {error && <div style={{ color: 'var(--danger-color)', marginTop: '12px', textAlign: 'center' }}>{error}</div>}

      {skills && (
        <div className="results-section visible" style={{ marginTop: '24px' }}>
          <div className="result-card neo-pressed" style={{ padding: '24px' }}>
            <h4 className="skills-heading match">
              <span className="material-symbols-outlined">psychology</span>
              Extracted Skills ({skills.length})
            </h4>
            <div className="skills-badges" style={{ marginTop: '16px' }}>
              {skills.length === 0 ? (
                <span className="empty-state">No technical skills found.</span>
              ) : (
                skills.map((skill, i) => (
                  <span key={i} className="skill-badge match visible">{skill}</span>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
