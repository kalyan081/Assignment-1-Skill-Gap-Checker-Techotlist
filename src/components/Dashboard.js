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

      <div className="dashboard-stats neo-pressed">
        <div className="stat-card neo-ext">
          <span className="material-symbols-outlined">assessment</span>
          <div className="stat-info">
            <span className="stat-value">{totalAnalyses}</span>
            <span className="stat-label">Total Analyses</span>
          </div>
        </div>
        <div className="stat-card neo-ext">
          <span className="material-symbols-outlined">monitoring</span>
          <div className="stat-info">
            <span className="stat-value">{avgMatch}%</span>
            <span className="stat-label">Avg Match Score</span>
          </div>
        </div>
      </div>

      <div className="dashboard-recent neo-pressed">
        <h4 className="section-heading">
          <span className="material-symbols-outlined">history</span>
          Recent Analyses
        </h4>
        <div className="history-list">
          {history.length === 0 ? (
            <p className="empty-state">No analyses yet.</p>
          ) : (
            [...history].sort((a, b) => b.matchPercentage - a.matchPercentage).map(entry => (
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
                  <button title="Export CSV" onClick={() => {
                    const rows = [
                      ['Field', 'Value'],
                      ['Match %', entry.matchPercentage],
                      ['Verdict', entry.data?.verdict || ''],
                      ['Matched Skills', entry.data?.matchedSkills?.join('; ') || ''],
                      ['Missing Skills', entry.data?.missingSkills?.join('; ') || ''],
                      ['Strategic Insight', entry.data?.strategicInsight || ''],
                      ['ONNX Prediction', entry.data?.predictedRole || '']
                    ];
                    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `skill-gap-report-${entry.id}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <span className="material-symbols-outlined">download</span>
                  </button>
                  <button title="Export PDF" onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) {
                      alert('Please allow popups to export PDF reports');
                      return;
                    }
                    const matchedList = entry.data?.matchedSkills?.map(s => `<li>${s}</li>`).join('') || '<li>None</li>';
                    const missingList = entry.data?.missingSkills?.map(s => `<li>${s}</li>`).join('') || '<li>None</li>';
                    const reasonsList = entry.data?.reasons?.map(r => `<li>${r}</li>`).join('') || '<li>None</li>';
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Skill Gap Analysis - ${entry.matchPercentage}% Match</title>
                          <style>
                            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
                            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                            .title { font-size: 28px; font-weight: 800; margin: 0; color: #0f172a; }
                            .meta { font-size: 14px; color: #64748b; margin-top: 5px; }
                            .score-badge { display: inline-block; padding: 8px 16px; border-radius: 9999px; font-weight: 700; font-size: 18px; margin-top: 15px; }
                            .score-high { background-color: #dcfce7; color: #15803d; }
                            .score-mid { background-color: #fef9c3; color: #a16207; }
                            .score-low { background-color: #fee2e2; color: #b91c1c; }
                            .section { margin-bottom: 25px; }
                            .section-title { font-size: 18px; font-weight: 700; color: #334155; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
                            ul { padding-left: 20px; margin: 0; }
                            li { margin-bottom: 6px; }
                            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
                            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #f8fafc; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1 class="title">Skill Gap Report</h1>
                            <div class="meta">Generated on ${entry.date}</div>
                            <div class="score-badge ${entry.matchPercentage >= 70 ? 'score-high' : entry.matchPercentage >= 40 ? 'score-mid' : 'score-low'}">
                              Match Percentage: ${entry.matchPercentage}%
                            </div>
                          </div>
                          <div class="section">
                            <h2 class="section-title">Fit Verdict</h2>
                            <p><strong>${entry.data?.verdict || 'Unknown'}</strong></p>
                            <ul>${reasonsList}</ul>
                          </div>
                          <div class="grid">
                            <div class="card">
                              <h3 style="margin-top:0; color:#15803d;">Core Strengths (${entry.data?.matchedSkills?.length || 0})</h3>
                              <ul>${matchedList}</ul>
                            </div>
                            <div class="card">
                              <h3 style="margin-top:0; color:#b91c1c;">Identified Gaps (${entry.data?.missingSkills?.length || 0})</h3>
                              <ul>${missingList}</ul>
                            </div>
                          </div>
                          <div class="section" style="margin-top: 30px;">
                            <h2 class="section-title">ONNX Classifier Prediction</h2>
                            <p>${entry.data?.predictedRole || 'Not available'}</p>
                          </div>
                          <script>
                            window.onload = function() {
                              window.print();
                              setTimeout(function() { window.close(); }, 500);
                            };
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}>
                    <span className="material-symbols-outlined">picture_as_pdf</span>
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
