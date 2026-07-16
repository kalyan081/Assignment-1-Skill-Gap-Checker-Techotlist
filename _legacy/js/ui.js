/**
 * ui.js — UI utilities: toasts, modals, animations, mobile menu
 */

const UI = (() => {

  /* ---------- TOAST NOTIFICATIONS ---------- */
  const toastContainer = document.getElementById('toastContainer');
  const ICONS = { error: 'error', success: 'check_circle', warning: 'warning', info: 'info' };

  function toast(message, type = 'error', duration = 4000) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="material-symbols-outlined">${ICONS[type] || 'info'}</span>${_escapeHtml(message)}`;
    toastContainer.appendChild(el);
    // Trigger entrance
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
    // Auto-dismiss
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 400);
    }, duration);
  }

  function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ---------- MODAL UTILS ---------- */
  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (profileModal.classList.contains('active')) _closeProfileModal();
      if (helpModal.classList.contains('active')) _closeHelpModal();
    }
  });

  /* ---------- PROFILE MODAL ---------- */
  const profileModal = document.getElementById('profileModal');
  const userNameInput = document.getElementById('userNameInput');
  const profileCancelBtn = document.getElementById('profileCancelBtn');
  const profileSaveBtn = document.getElementById('profileSaveBtn');
  
  function _openProfileModal() {
    userNameInput.value = localStorage.getItem('skilllens-name') || '';
    profileModal.classList.add('active');
    setTimeout(() => userNameInput.focus(), 300);
  }

  function _closeProfileModal() {
    profileModal.classList.remove('active');
  }

  function _initProfile() {
    const avatarBtn = document.querySelector('.header-avatar');
    if (avatarBtn) avatarBtn.addEventListener('click', _openProfileModal);
    
    if (profileCancelBtn) profileCancelBtn.addEventListener('click', _closeProfileModal);
    if (profileSaveBtn) {
      profileSaveBtn.addEventListener('click', () => {
        const name = userNameInput.value.trim();
        if (name) {
          localStorage.setItem('skilllens-name', name);
          _updateGreeting();
          toast('Profile updated!', 'success');
        } else {
          localStorage.removeItem('skilllens-name');
          _updateGreeting();
        }
        _closeProfileModal();
      });
    }

    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) _closeProfileModal();
    });

    _updateGreeting();
  }

  function _updateGreeting() {
    const name = localStorage.getItem('skilllens-name') || 'there';
    document.querySelectorAll('.user-greeting').forEach(el => {
      el.textContent = `Hello, ${name}!`;
    });
    const avatarCircle = document.querySelector('.avatar-circle');
    if (avatarCircle) {
      avatarCircle.textContent = name !== 'there' ? name.charAt(0).toUpperCase() : 'J';
    }
  }

  /* ---------- HELP MODAL ---------- */
  const helpModal = document.getElementById('helpModal');
  function _openHelpModal(e) {
    if(e) e.preventDefault();
    helpModal.classList.add('active');
  }
  function _closeHelpModal() {
    helpModal.classList.remove('active');
  }
  function _initHelp() {
    const helpLink = document.getElementById('helpLink');
    const helpCloseBtn = document.getElementById('helpCloseBtn');
    if (helpLink) helpLink.addEventListener('click', _openHelpModal);
    if (helpCloseBtn) helpCloseBtn.addEventListener('click', _closeHelpModal);
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) _closeHelpModal();
    });
  }

  /* ---------- LOGOUT ---------- */
  function _initLogout() {
    const logoutBtn = document.getElementById('logoutLink');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if(confirm('Are you sure you want to log out? This will clear all history and settings.')) {
          localStorage.clear();
          location.reload();
        }
      });
    }
  }

  /* ---------- MOBILE MENU ---------- */
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuBtn = document.getElementById('mobileMenuBtn');

  function _initMobileMenu() {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.add('mobile-open');
      overlay.classList.add('active');
    });
    overlay.addEventListener('click', _closeMobileSidebar);
  }

  function _closeMobileSidebar() {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  }

  /* ---------- SIDEBAR NAV ---------- */
  /* ---------- VIEW NAVIGATION ---------- */
  function _initNav() {
    const navLinks = document.querySelectorAll('.nav-link[data-page], .mobile-nav-link[data-page]');
    const sections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = link.getAttribute('data-page');

        // Update active links
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelectorAll(`[data-page="${targetPage}"]`).forEach(l => l.classList.add('active'));

        // Update sections
        sections.forEach(sec => {
          if (sec.id === targetPage) {
            sec.classList.remove('hidden');
            sec.classList.add('active');
          } else {
            sec.classList.add('hidden');
            sec.classList.remove('active');
          }
        });

        _closeMobileSidebar();
        
        // Trigger resize event in case charts/canvas need layout
        window.dispatchEvent(new Event('resize'));
      });
    });
  }

  /* ---------- SHAKE ANIMATION ---------- */
  function shake(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
  }

  /* ---------- CHAR COUNTERS ---------- */
  function _initCharCounters() {
    const resumeInput = document.getElementById('resumeInput');
    const jdInput = document.getElementById('jdInput');
    const resumeCount = document.getElementById('resumeCharCount');
    const jdCount = document.getElementById('jdCharCount');

    resumeInput.addEventListener('input', () => {
      resumeCount.textContent = `${resumeInput.value.length} characters`;
    });
    jdInput.addEventListener('input', () => {
      jdCount.textContent = `${jdInput.value.length} characters`;
    });
  }

  /* ---------- FILE UPLOAD (PDF, DOCX, TXT) ---------- */
  function _initFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadResumeBtn');
    const resumeInput = document.getElementById('resumeInput');
    const resumeCount = document.getElementById('resumeCharCount');

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const name = file.name.toLowerCase();
      resumeCount.textContent = 'Extracting text…';

      try {
        let text = '';

        if (name.endsWith('.pdf')) {
          text = await _extractPDF(file);
        } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
          text = await _extractDOCX(file);
        } else if (name.endsWith('.txt') || name.endsWith('.text')) {
          text = await _readAsText(file);
        } else {
          toast('Unsupported format. Use PDF, DOCX, or TXT.', 'warning');
          resumeCount.textContent = 'Supports PDF, DOCX, TXT';
          fileInput.value = '';
          return;
        }

        text = text.trim();
        if (!text) {
          toast('Could not extract any text from this file.', 'warning');
          resumeCount.textContent = 'Supports PDF, DOCX, TXT';
        } else {
          resumeInput.value = text;
          resumeCount.textContent = `${text.length.toLocaleString()} characters extracted`;
          toast(`Resume loaded from ${file.name}`, 'success');
        }
      } catch (err) {
        console.error('[SkillLens] File extraction error:', err);
        toast(`Failed to read file: ${err.message}`, 'error');
        resumeCount.textContent = 'Supports PDF, DOCX, TXT';
      }

      fileInput.value = '';
    });
  }

  /** Extract text from a PDF file using pdf.js */
  async function _extractPDF(file) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded. Check your connection.');
    }
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      pages.push(strings.join(' '));
    }

    return pages.join('\n\n');
  }

  /** Extract text from a DOCX file using mammoth.js */
  async function _extractDOCX(file) {
    if (typeof mammoth === 'undefined') {
      throw new Error('Mammoth.js library not loaded. Check your connection.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  }

  /** Read a plain text file */
  function _readAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsText(file);
    });
  }

  /* ---------- CLEAR JD ---------- */
  function _initClearJd() {
    const clearBtn = document.getElementById('clearJdBtn');
    const jdInput = document.getElementById('jdInput');
    const jdCount = document.getElementById('jdCharCount');

    clearBtn.addEventListener('click', () => {
      jdInput.value = '';
      jdCount.textContent = '0 characters';
    });
  }

  /* ---------- INIT ---------- */
  function init() {
    _initProfile();
    _initHelp();
    _initLogout();
    _initMobileMenu();
    _initNav();
    _initCharCounters();
    _initFileUpload();
    _initClearJd();
  }

  return {
    init,
    toast,
    shake
  };
})();

// Initialize UI
UI.init();
