'use client';

import React from 'react';

export default function Dashboard({ userName, history, onLoadAnalysis, onDeleteAnalysis }) {
  const totalAnalyses = history.length;
  const avgMatch = totalAnalyses > 0 
    ? Math.round(history.reduce((acc, h) => acc + (h.matchPercentage || 0), 0) / totalAnalyses)
    : 0;

  return (
    <section id="view-dashboard" className="view-section active">
      <div className="hero">
        <div className="hero-text">
          <h3 className="hero-greeting user-greeting">Hello, {userName || 'there'}!</h3>
          <p className="hero-tagline">Your skills overview and recent activity.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dash-card neo-pressed">
          <div className="dash-card-icon">
            <span className="material-symbols-outlined">bar_chart</span>
          </div>
          <div className="dash-card-info">
            <h4 id="dashTotalAnalyses">{totalAnalyses}</h4>
            <p>TOTAL ANALYSES</p>
          </div>
        </div>
        <div className="dash-card neo-pressed">
          <div className="dash-card-icon">
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div className="dash-card-info">
            <h4 id="dashAvgMatch">{avgMatch}%</h4>
            <p>AVG MATCH SCORE</p>
          </div>
        </div>
      </div>

      <div className="history-section neo-pressed">
        <h4 className="section-heading">
          <span className="material-symbols-outlined">history</span>
          Recent Analyses
        </h4>
        <div className="history-list">
          {history.length === 0 ? (
            <p className="empty-state">No analyses yet.</p>
          ) : (
            history.map(entry => (
              <div key={entry.id} className="history-item">
                <div className={`history-score ${entry.matchPercentage >= 70 ? 'high' : entry.matchPercentage >= 40 ? 'mid' : 'low'}`}>
                  {entry.matchPercentage}%
                </div>
                <div className="history-info">
                  <div className="history-title">{entry.resumeSnippet || 'Analysis'}…</div>
                  <div className="history-meta">{entry.date} · {entry.matchedCount} matched · {entry.missingCount} gaps</div>
                </div>
                <div className="history-actions">
                  <button title="Load this analysis" onClick={() => onLoadAnalysis(entry.data)}>
                    <span className="material-symbols-outlined">open_in_new</span>
                  </button>
                  <button title="Delete" onClick={() => onDeleteAnalysis(entry.id)}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
