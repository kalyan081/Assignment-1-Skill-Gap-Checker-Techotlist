'use client';

import React from 'react';

export default function Header({ activeView, toggleTheme, onProfileModal }) {
  const titles = {
    'view-dashboard': 'Dashboard',
    'view-skill-analysis': 'Skill Extraction',
    'view-gap-analysis': 'Gap Analysis',
    'view-learning-path': 'Learning Path'
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-left">
          <button className="icon-btn mobile-menu-btn" aria-label="Open menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h2 className="header-title">{titles[activeView] || 'Gap Analysis'}</h2>
        </div>
        <div className="header-right">
          <button className="icon-btn" id="themeToggle" title="Toggle theme" onClick={toggleTheme}>
            <span className="material-symbols-outlined icon-sun">light_mode</span>
            <span className="material-symbols-outlined icon-moon">dark_mode</span>
          </button>
          <button className="icon-btn" title="Notifications" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="header-avatar" title="Profile" onClick={onProfileModal}>
            <div className="avatar-circle">J</div>
          </div>
        </div>
      </div>
    </header>
  );
}
