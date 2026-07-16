'use client';

import React from 'react';

export default function Sidebar({ activeView, setActiveView, onHelpModal }) {
  const links = [
    { id: 'view-dashboard', icon: 'home', label: 'Dashboard' },
    { id: 'view-skill-analysis', icon: 'bar_chart', label: 'Skill Analysis' },
    { id: 'view-gap-analysis', icon: 'query_stats', label: 'Gap Analysis' },
  ];

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-brand">
        <h1 style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.2' }}>
          <span style={{ fontWeight: 'bold', fontSize: '2em' }}>Techotlist</span>
          <span style={{ fontSize: '1.5em' }}>Assignment - 1 & 2</span>
          <span style={{ fontSize: '1em' }}>Skill & Fit Analyzer</span>
        </h1>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <a
            key={link.id}
            href="#"
            className={`nav-link ${activeView === link.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveView(link.id);
            }}
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="pro-tip neo-pressed" style={{ marginTop: 'auto', marginBottom: '24px' }}>
        <div className="pro-tip-label">PRO TIP</div>
        <p className="pro-tip-text">Paste real resume text and a full job posting for the most accurate analysis.</p>
        <button 
          className="pro-tip-btn neo-ext" 
          onClick={() => setActiveView('view-gap-analysis')}
        >
          Re-Analyze
        </button>
      </div>
      <div className="sidebar-footer">
        <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onHelpModal(); }}>
          <span className="material-symbols-outlined">help</span>
          Help
        </a>
      </div>
    </aside>
  );
}
