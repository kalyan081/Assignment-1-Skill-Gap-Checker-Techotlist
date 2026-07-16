'use client';

import React, { useState } from 'react';

export default function LearningPath({ lastResult }) {
  const [loading, setLoading] = useState(false);
  const [pathHtml, setPathHtml] = useState(null);
  const [error, setError] = useState(null);

  const missingSkills = lastResult?.missingSkills || [];

  const handleGenerate = async () => {
    if (missingSkills.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missingSkills })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to generate path');
      
      // Basic markdown to HTML
      let html = data.markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

      html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
      
      setPathHtml(html);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="view-learning-path" className="view-section active">
      <div className="hero">
        <div className="hero-text">
          <h3 className="hero-greeting">Your Custom Learning Path</h3>
          <p className="hero-tagline">AI-generated curriculum based on your skill gaps.</p>
        </div>
      </div>

      <div className="results-section visible" style={{ marginTop: '24px' }}>
        <div className="results-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="result-card neo-pressed">
            <h4 className="card-title" style={{ color: 'var(--primary-color)' }}>
              <span className="material-symbols-outlined">target</span>
              Target Skills
            </h4>
            <div className="skill-container">
              {missingSkills.length === 0 ? (
                <span className="empty-state">No gaps identified. Run a Gap Analysis first!</span>
              ) : (
                missingSkills.map((skill, i) => (
                  <span key={i} className="skill-badge gap-skill visible">{skill}</span>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="cta-wrapper" style={{ marginTop: '24px' }}>
          <button 
            className="btn-analyze" 
            onClick={handleGenerate} 
            disabled={loading || missingSkills.length === 0}
          >
            {loading ? (
              <span><span className="spinner"></span> Generating...</span>
            ) : (
              <>
                <span className="material-symbols-outlined">school</span>
                <span>Generate Curriculum</span>
              </>
            )}
          </button>
        </div>

        {error && <div style={{ color: 'var(--danger-color)', marginTop: '12px', textAlign: 'center' }}>{error}</div>}

        {pathHtml && (
          <div className="result-card neo-pressed" style={{ marginTop: '24px' }}>
            <div className="learning-path-content" dangerouslySetInnerHTML={{ __html: pathHtml }} />
          </div>
        )}
      </div>
    </section>
  );
}
