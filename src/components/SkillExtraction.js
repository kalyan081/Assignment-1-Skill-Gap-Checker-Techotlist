'use client';

import React, { useState } from 'react';

export default function SkillExtraction() {
  const [text, setText] = useState('');
  const [skills, setSkills] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExtract = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
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

  return (
    <section id="view-skill-analysis" className="view-section active">
      <div className="hero">
        <div className="hero-text">
          <h3 className="hero-greeting">Skill Extraction</h3>
          <p className="hero-tagline">Extract and categorize technical skills from any text.</p>
        </div>
      </div>
      <div className="input-card neo-pressed" style={{ marginTop: '24px' }}>
        <textarea 
          placeholder="Paste a resume, job description, or any text here..." 
          style={{ minHeight: '200px', width: '100%', background: 'transparent', border: 'none', color: 'inherit', resize: 'vertical', outline: 'none' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="cta-wrapper" style={{ marginTop: '24px' }}>
        <button className="btn-analyze" onClick={handleExtract} disabled={loading || !text.trim()}>
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
          <div className="results-grid">
            <div className="result-card neo-pressed">
              <h4 className="skills-heading match">
                <span className="material-symbols-outlined">psychology</span>
                Extracted Skills ({skills.length})
              </h4>
              <div className="skills-badges">
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
        </div>
      )}
    </section>
  );
}
