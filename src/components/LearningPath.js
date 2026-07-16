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
          <h3 className="hero-greeting">Learning Path</h3>
          <p className="hero-tagline">AI-generated curriculum based on your skill gaps.</p>
        </div>
        <div className="hero-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleGenerate} 
            disabled={loading || missingSkills.length === 0}
          >
            {loading ? (
              <span><span className="spinner"></span> Generating...</span>
            ) : (
              <>
                <span className="material-symbols-outlined">school</span>
                Generate Curriculum
              </>
            )}
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'var(--gap)', marginTop: '12px', textAlign: 'center' }}>{error}</div>}

      {pathHtml ? (
        <div className="learning-path-content neo-pressed visible" style={{ marginTop: '24px', padding: '24px', borderRadius: 'var(--radius-xl)' }}>
          <div dangerouslySetInnerHTML={{ __html: pathHtml }} />
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: '40px', textAlign: 'center' }}>
          {missingSkills.length === 0 
            ? "Run a Gap Analysis first, then come here to generate a custom learning path." 
            : `Ready to generate a curriculum for: ${missingSkills.join(', ')}`}
        </div>
      )}
    </section>
  );
}
