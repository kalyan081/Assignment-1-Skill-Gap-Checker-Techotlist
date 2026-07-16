'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import GapAnalysis from '@/components/GapAnalysis';
import SkillExtraction from '@/components/SkillExtraction';

export default function Home() {
  const [activeView, setActiveView] = useState('view-gap-analysis');
  const [userName, setUserName] = useState('');
  const [theme, setTheme] = useState('dark');
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    // Load state from localStorage on mount
    const savedName = localStorage.getItem('skillLens_userName');
    if (savedName) setUserName(savedName);

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    } else {
      document.body.setAttribute('data-theme', 'dark');
    }

    try {
      const h = JSON.parse(localStorage.getItem('skillLens_history')) || [];
      setHistory(h);
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleAnalysisComplete = (data, resumeSnippet) => {
    setLastResult(data);
    
    // Add to history
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      resumeSnippet: resumeSnippet.substring(0, 30),
      matchPercentage: data.matchPercentage,
      matchedCount: data.matchedSkills.length,
      missingCount: data.missingSkills.length,
      data: data
    };
    
    const newHistory = [newEntry, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('skillLens_history', JSON.stringify(newHistory));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    if (name) {
      setUserName(name);
      localStorage.setItem('skillLens_userName', name);
    }
    setShowProfileModal(false);
  };

  const handleDeleteAnalysis = (id) => {
    if (confirm('Delete this analysis?')) {
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem('skillLens_history', JSON.stringify(newHistory));
    }
  };

  return (
    <div className="app-shell">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onHelpModal={() => setShowHelpModal(true)} 
      />
      
      <main className="main-content">
        <Header 
          activeView={activeView} 
          toggleTheme={toggleTheme}
          onProfileModal={() => setShowProfileModal(true)}
        />
        
        <div className="page-content">
          <div style={{ display: activeView === 'view-dashboard' ? 'block' : 'none' }}>
            <Dashboard 
              userName={userName} 
              history={history} 
              onLoadAnalysis={(data) => {
                setLastResult(data);
                setActiveView('view-gap-analysis');
              }}
              onDeleteAnalysis={handleDeleteAnalysis}
            />
          </div>
          
          <div style={{ display: activeView === 'view-skill-analysis' ? 'block' : 'none' }}>
            <SkillExtraction />
          </div>
          
          <div style={{ display: activeView === 'view-gap-analysis' ? 'block' : 'none' }}>
            <GapAnalysis 
              userName={userName} 
              onAnalysisComplete={handleAnalysisComplete}
              loadedData={activeView === 'view-gap-analysis' ? lastResult : null}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {showProfileModal && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowProfileModal(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="modal-title">Your Profile</h3>
            <p className="modal-subtitle">Personalize your experience</p>
            <form onSubmit={handleSaveProfile}>
              <input 
                name="name"
                className="modal-input neo-pressed" 
                placeholder="Enter your name..." 
                defaultValue={userName}
                autoFocus
              />
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>Save Profile</button>
            </form>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowHelpModal(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="modal-title">Help Guide</h3>
            <ul style={{ paddingLeft: '20px', margin: '20px 0', lineHeight: '1.6' }}>
              <li><strong>Gap Analysis:</strong> Compare a resume against a JD.</li>
              <li><strong>Skill Extraction:</strong> Just extract skills from any text block.</li>
            </ul>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setShowHelpModal(false)}>Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
}
