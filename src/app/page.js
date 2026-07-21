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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [lastSnippet, setLastSnippet] = useState(null);
  const [sharedResumeText, setSharedResumeText] = useState('');
  
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    // Load state from localStorage on mount
    const savedName = localStorage.getItem('skillLens_userName');
    if (savedName) {
      setUserName(savedName);
      setIsLoggedIn(true);
    }

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

    setIsInitialized(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleAnalysisComplete = (data, resumeSnippet) => {
    setLastResult(data);
    setLastSnippet(resumeSnippet);
  };

  const handleSaveReport = () => {
    if (!lastResult) return;
    
    // 1. Export as real CSV file download
    const rows = [
      ['Field', 'Value'],
      ['Match %', lastResult.matchPercentage],
      ['Verdict', lastResult.verdict],
      ['Matched Skills', lastResult.matchedSkills.join('; ')],
      ['Missing Skills', lastResult.missingSkills.join('; ')],
      ['Strategic Insight', lastResult.strategicInsight || ''],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-gap-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // 2. Also save to localStorage history
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      resumeSnippet: lastSnippet?.substring(0, 30) || 'Analysis',
      matchPercentage: lastResult.matchPercentage,
      matchedCount: lastResult.matchedSkills.length,
      missingCount: lastResult.missingSkills.length,
      data: lastResult
    };
    
    const newHistory = [newEntry, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('skillLens_history', JSON.stringify(newHistory));
  };


  const handleDeleteAnalysis = (id) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('skillLens_history', JSON.stringify(newHistory));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name').trim();
    if (name) {
      setUserName(name);
      localStorage.setItem('skillLens_userName', name);
      setIsLoggedIn(true);
    }
  };

  if (!isInitialized) return null;

  if (!isLoggedIn) {
    return (
      <div className="modal-overlay active" style={{ background: 'var(--bg)' }}>
        <div className="modal-content">
          <div className="modal-icon">
            <span className="material-symbols-outlined">login</span>
          </div>
          <h2 className="modal-title">Welcome</h2>
          <p className="modal-desc">Please enter your name to continue.</p>
          <div style={{ fontSize: '12.5px', color: 'var(--gap)', marginTop: '-8px', marginBottom: '24px', textAlign: 'center', opacity: 0.9 }}>
            <em>Disclaimer: This is not a real login for authentication. It only saves your name locally for personalization.</em>
          </div>
          <form onSubmit={handleLogin}>
            <div className="modal-field">
              <label className="modal-field-label" htmlFor="loginNameInput">Name</label>
              <input 
                type="text"
                name="name"
                id="loginNameInput"
                className="modal-input" 
                placeholder="e.g. Jordan" 
                autoComplete="off"
                autoFocus
                required
              />
            </div>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Continue</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
            <SkillExtraction 
              sharedText={sharedResumeText}
              setSharedText={setSharedResumeText}
            />
          </div>
          
          <div style={{ display: activeView === 'view-gap-analysis' ? 'block' : 'none' }}>
            <GapAnalysis 
              userName={userName} 
              onAnalysisComplete={handleAnalysisComplete}
              onSaveReport={handleSaveReport}
              loadedData={activeView === 'view-gap-analysis' ? lastResult : null}
              sharedText={sharedResumeText}
              setSharedText={setSharedResumeText}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {showHelpModal && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 className="modal-title">How to use SkillLens</h2>
            <div className="insight-text" style={{ marginTop: '16px' }}>
              <p><strong>1. Configure API:</strong> Add your Gemini API Key via the `.env.local` file.</p>
              <p><strong>2. Gap Analysis:</strong> Paste your resume and a job description to see how well you match.</p>
              <p><strong>3. Skill Analysis:</strong> Extract skills from a single document without comparison.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowHelpModal(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
