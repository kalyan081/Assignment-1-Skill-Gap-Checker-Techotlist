
const App = (() => {

  /* ---------- DOM REFS ---------- */
  const resumeInput = document.getElementById('resumeInput');
  const jdInput = document.getElementById('jdInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const analyzeBtnText = document.getElementById('analyzeBtnText');
  const analyzeBtnIcon = document.getElementById('analyzeBtnIcon');
  const resultsSection = document.getElementById('resultsSection');
  const ringProgress = document.getElementById('ringProgress');
  const ringPercentage = document.getElementById('ringPercentage');
  const ringLabel = document.getElementById('ringLabel');
  const matchedBadges = document.getElementById('matchedBadges');
  const missingBadges = document.getElementById('missingBadges');
  const matchCount = document.getElementById('matchCount');
  const gapCount = document.getElementById('gapCount');
  const insightText = document.getElementById('insightText');
  const saveReportBtn = document.getElementById('saveReportBtn');
  const shareBtn = document.getElementById('shareBtn');
  const reAnalyzeBtn = document.getElementById('reAnalyzeBtn');
  const historyList = document.getElementById('historyList');

  // Dashboard Refs
  const dashTotalAnalyses = document.getElementById('dashTotalAnalyses');
  const dashAvgMatch = document.getElementById('dashAvgMatch');
  const dashboardHistoryList = document.getElementById('dashboardHistoryList');

  // Skill Extraction Refs
  const singleSkillInput = document.getElementById('singleSkillInput');
  const extractSkillsBtn = document.getElementById('extractSkillsBtn');
  const extractBtnIcon = document.getElementById('extractBtnIcon');
  const extractBtnText = document.getElementById('extractBtnText');
  const extractionResults = document.getElementById('extractionResults');

  // Learning Path Refs
  const generatePathBtn = document.getElementById('generatePathBtn');
  const learningPathResult = document.getElementById('learningPathResult');
  const learningPathEmpty = document.getElementById('learningPathEmpty');

  const HISTORY_KEY = 'skilllens-history';
  const RING_CIRCUMFERENCE = 2 * Math.PI * 110; // r=110
  let lastResult = null;

  /* ---------- MATCH LABEL ---------- */
  function _getLabel(pct) {
    if (pct >= 85) return 'Exceptional';
    if (pct >= 70) return 'Strong';
    if (pct >= 50) return 'Moderate';
    if (pct >= 30) return 'Developing';
    return 'Needs Work';
  }

  /* ---------- PROGRESS RING ANIMATION ---------- */
  function _animateRing(pct) {
    ringProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
    ringProgress.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;

    // Animate after a tick
    requestAnimationFrame(() => {
      setTimeout(() => {
        const offset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;
        ringProgress.style.strokeDashoffset = `${offset}`;
      }, 150);
    });

    // Count up
    let current = 0;
    const step = Math.max(1, Math.ceil(pct / 50));
    const interval = setInterval(() => {
      current = Math.min(current + step, pct);
      ringPercentage.textContent = `${current}%`;
      if (current >= pct) clearInterval(interval);
    }, 30);

    ringLabel.textContent = _getLabel(pct);
  }

  /* ---------- RENDER BADGES ---------- */
  function _renderBadges(container, skills, type) {
    container.innerHTML = '';
    if (!skills || skills.length === 0) {
      container.innerHTML = `<span class="empty-state">${type === 'match' ? 'No matching skills found' : 'No gaps — great match!'
        }</span>`;
      return;
    }
    skills.forEach((skill, i) => {
      const el = document.createElement('span');
      el.className = `skill-badge ${type === 'match' ? 'match' : 'gap-skill'}`;
      el.textContent = skill;
      container.appendChild(el);
      setTimeout(() => el.classList.add('visible'), 80 + i * 60);
    });
  }

  /* ---------- RENDER RESULTS ---------- */
  function _renderResults(data) {
    lastResult = data;

    // Enable action buttons
    saveReportBtn.disabled = false;
    shareBtn.disabled = false;

    // Show section
    resultsSection.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resultsSection.classList.add('visible'));
    });

    // Ring
    _animateRing(data.matchPercentage || 0);

    // Badges
    _renderBadges(matchedBadges, data.matchedSkills, 'match');
    _renderBadges(missingBadges, data.missingSkills, 'gap');
    matchCount.textContent = (data.matchedSkills || []).length;
    gapCount.textContent = (data.missingSkills || []).length;

    // Insight
    if (data.strategicInsight) {
      let html = data.strategicInsight;
      html = html.replace(/\*\*(.*?)\*\*/g, '<span class="highlight">$1</span>');
      insightText.innerHTML = html;
    } else {
      insightText.textContent = 'Analysis complete. Review the results above.';
    }

    // Scroll to results
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);

    // Save to history
    _addToHistory(data);
  }

  /* ---------- LOADING STATE ---------- */
  function _setLoading(loading) {
    analyzeBtn.disabled = loading;
    if (loading) {
      analyzeBtnIcon.style.display = 'none';
      analyzeBtnText.innerHTML = '<span class="spinner"></span> Analyzing…';
    } else {
      analyzeBtnIcon.style.display = '';
      analyzeBtnText.textContent = 'Analyze Candidate Fit';
    }
  }

  /* ---------- ANALYZE ---------- */
  async function _handleAnalyze() {
    const resume = resumeInput.value.trim();
    const jd = jdInput.value.trim();

    // Validate
    if (!resume && !jd) {
      UI.shake(document.getElementById('resumeCard'));
      UI.shake(document.getElementById('jdCard'));
      UI.toast('Please paste both a resume and a job description.', 'error');
      return;
    }
    if (!resume) {
      UI.shake(document.getElementById('resumeCard'));
      UI.toast('Please paste the candidate resume.', 'error');
      return;
    }
    if (!jd) {
      UI.shake(document.getElementById('jdCard'));
      UI.toast('Please paste the job description.', 'error');
      return;
    }

    // Hide old results
    resultsSection.classList.remove('visible');
    setTimeout(() => resultsSection.classList.add('hidden'), 350);

    _setLoading(true);

    try {
      const result = await GeminiAPI.analyze(resume, jd);
      _renderResults(result);
      UI.toast('Analysis complete!', 'success');
    } catch (err) {
      console.error('[SkillLens] Analysis error:', err);
      UI.toast(`Analysis failed: ${err.message}`, 'error');
    } finally {
      _setLoading(false);
    }
  }

  /* ---------- HISTORY ---------- */
  function _getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  }

  function _saveHistory(list) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 10))); // keep last 10
  }

  function _addToHistory(data) {
    const list = _getHistory();
    const entry = {
      id: Date.now(),
      matchPercentage: data.matchPercentage || 0,
      matchedCount: (data.matchedSkills || []).length,
      missingCount: (data.missingSkills || []).length,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      resumeSnippet: resumeInput.value.substring(0, 60).replace(/\n/g, ' '),
      data: data,
    };
    list.unshift(entry);
    _saveHistory(list);
    _renderHistory();
  }

  function _renderHistory() {
    const list = _getHistory();
    if (list.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No analyses yet. Run your first one above!</p>';
      return;
    }
    historyList.innerHTML = '';
    list.forEach(entry => {
      const scoreClass = entry.matchPercentage >= 70 ? 'high' : entry.matchPercentage >= 40 ? 'mid' : 'low';
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-score ${scoreClass}">${entry.matchPercentage}%</div>
        <div class="history-info">
          <div class="history-title">${_escapeHtml(entry.resumeSnippet || 'Analysis')}…</div>
          <div class="history-meta">${entry.date} · ${entry.matchedCount} matched · ${entry.missingCount} gaps</div>
        </div>
        <div class="history-actions">
          <button title="Load this analysis" data-id="${entry.id}">
            <span class="material-symbols-outlined">open_in_new</span>
          </button>
          <button title="Delete" data-delete="${entry.id}">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      `;
      // Load handler
      item.querySelector('[data-id]').addEventListener('click', (e) => {
        e.stopPropagation();

        // Switch to gap-analysis view
        document.querySelector('[data-page="view-gap-analysis"]').click();
        _renderResults(entry.data);
      });
      // Delete handler
      item.querySelector('[data-delete]').addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = _getHistory().filter(h => h.id !== entry.id);
        _saveHistory(updated);
        _renderHistory();
        UI.toast('Entry removed.', 'success');
      });
      historyList.appendChild(item);

      // Clone for dashboard
      const dashItem = item.cloneNode(true);
      dashItem.querySelector('[data-id]').addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelector('[data-page="view-gap-analysis"]').click();
        _renderResults(entry.data);
      });
      dashItem.querySelector('[data-delete]').addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = _getHistory().filter(h => h.id !== entry.id);
        _saveHistory(updated);
        _renderHistory();
        _renderDashboardStats();
      });
      if (dashboardHistoryList) dashboardHistoryList.appendChild(dashItem);
    });
  }

  function _renderDashboardStats() {
    const list = _getHistory();
    if (!dashTotalAnalyses) return;

    dashTotalAnalyses.textContent = list.length;

    if (list.length === 0) {
      dashAvgMatch.textContent = '0%';
      return;
    }

    const sum = list.reduce((acc, entry) => acc + (entry.matchPercentage || 0), 0);
    const avg = Math.round(sum / list.length);
    dashAvgMatch.textContent = `${avg}%`;
  }

  function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ---------- SAVE REPORT ---------- */
  function _saveReport() {
    if (!lastResult) {
      UI.toast('Run an analysis first.', 'warning');
      return;
    }
    const report = {
      tool: 'SkillLens AI Skill Gap Analyzer',
      generatedAt: new Date().toISOString(),
      matchPercentage: lastResult.matchPercentage,
      label: _getLabel(lastResult.matchPercentage),
      matchedSkills: lastResult.matchedSkills,
      missingSkills: lastResult.missingSkills,
      strategicInsight: lastResult.strategicInsight,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skilllens-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Report downloaded!', 'success');
  }

  /* ---------- SHARE ---------- */
  function _share() {
    if (!lastResult) {
      UI.toast('Run an analysis first.', 'warning');
      return;
    }
    const text = [
      `📊 SkillLens Analysis Report`,
      `Match: ${lastResult.matchPercentage}% (${_getLabel(lastResult.matchPercentage)})`,
      ``,
      `✅ Matched: ${(lastResult.matchedSkills || []).join(', ') || 'None'}`,
      `❌ Gaps: ${(lastResult.missingSkills || []).join(', ') || 'None'}`,
      ``,
      `💡 ${lastResult.strategicInsight || ''}`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      UI.toast('Copied to clipboard!', 'success');
    }).catch(() => {
      UI.toast('Could not copy to clipboard.', 'error');
    });
  }

  /* ---------- LEARNING PATH ---------- */
  async function _handleLearningPath() {
    if (!lastResult || !lastResult.missingSkills || lastResult.missingSkills.length === 0) {
      UI.toast('No missing skills to generate a path for.', 'warning');
      return;
    }

    generatePathBtn.disabled = true;
    generatePathBtn.innerHTML = '<span class="spinner"></span> Generating...';

    try {
      const markdown = await GeminiAPI.generateLearningPath(lastResult.missingSkills);

      // Basic markdown to HTML (just handling bold, lists, and newlines for now)
      let html = markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

      // Wrap lists
      html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

      learningPathResult.innerHTML = html;
      learningPathEmpty.classList.add('hidden');
      learningPathResult.classList.remove('hidden');

      UI.toast('Learning path generated!', 'success');
    } catch (err) {
      UI.toast('Failed to generate learning path.', 'error');
      console.error(err);
    } finally {
      generatePathBtn.disabled = false;
      generatePathBtn.innerHTML = '<span class="material-symbols-outlined">school</span> Generate Curriculum';
    }
  }

  /* ---------- SKILL EXTRACTION ---------- */
  async function _handleExtractSkills() {
    const text = singleSkillInput.value.trim();
    if (!text) {
      UI.shake(singleSkillInput.parentElement);
      UI.toast('Please paste some text to extract skills from.', 'error');
      return;
    }

    extractSkillsBtn.disabled = true;
    extractBtnIcon.style.display = 'none';
    extractBtnText.innerHTML = '<span class="spinner"></span> Extracting...';
    extractionResults.classList.add('hidden');

    try {
      const skills = await GeminiAPI.extractSkills(text);

      extractionResults.innerHTML = '';
      if (!skills || skills.length === 0) {
        extractionResults.innerHTML = '<span class="empty-state">No technical skills found in the text.</span>';
      } else {
        const title = document.createElement('h4');
        title.className = 'skills-heading match';
        title.innerHTML = '<span class="material-symbols-outlined">list</span> Extracted Skills';
        extractionResults.appendChild(title);

        const badges = document.createElement('div');
        badges.className = 'skills-badges';
        _renderBadges(badges, skills, 'match');
        extractionResults.appendChild(badges);
      }

      extractionResults.classList.remove('hidden');
      requestAnimationFrame(() => extractionResults.classList.add('visible'));

      UI.toast(`Extracted ${skills.length} skills!`, 'success');
    } catch (err) {
      UI.toast('Failed to extract skills.', 'error');
      console.error(err);
    } finally {
      extractSkillsBtn.disabled = false;
      extractBtnIcon.style.display = '';
      extractBtnText.textContent = 'Extract Skills';
    }
  }

  /* ---------- INIT ---------- */
  function init() {
    // Analyze button
    analyzeBtn.addEventListener('click', _handleAnalyze);

    // Keyboard shortcut: Ctrl+Enter
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzeBtn.click();
      }
    });

    // Action buttons
    saveReportBtn.addEventListener('click', _saveReport);
    shareBtn.addEventListener('click', _share);

    // Re-Analyze scrolls to top and focuses Gap Analysis
    if (reAnalyzeBtn) {
      reAnalyzeBtn.addEventListener('click', () => {
        document.querySelector('[data-page="view-gap-analysis"]').click();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => resumeInput.focus(), 400);
      });
    }

    // Features
    if (generatePathBtn) generatePathBtn.addEventListener('click', _handleLearningPath);
    if (extractSkillsBtn) extractSkillsBtn.addEventListener('click', _handleExtractSkills);

    // Render any existing history
    _renderHistory();
    _renderDashboardStats();
  }

  return { init };
})();

// Boot
App.init();
