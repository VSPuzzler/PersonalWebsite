/* ========================================
   VineetOS - Desktop Environment JavaScript
   ======================================== */

(function() {
  'use strict';

  // ========================================
  // State Management
  // ========================================

  const state = {
    windows: {},
    activeWindow: null,
    highestZIndex: 100,
    soundEnabled: true,
    crtEnabled: false,
    isMobile: window.innerWidth < 768,
    dragState: null,
    resizeState: null,
    iconDragState: null
  };

  // Window titles for taskbar
  const windowTitles = {
    about: 'About Me',
    projects: 'Projects',
    experience: 'Experience',
    research: 'Research',
    skills: 'Skills',
    media: 'Media',
    resume: 'Resume',
    contact: 'Contact'
  };

  // ========================================
  // DOM Elements
  // ========================================

  const elements = {
    desktop: document.getElementById('desktop'),
    bootScreen: document.getElementById('boot-screen'),
    crtOverlay: document.getElementById('crt-overlay'),
    windowsContainer: document.getElementById('windows-container'),
    iconGrid: document.getElementById('icon-grid'),
    taskbar: document.getElementById('taskbar'),
    taskbarWindows: document.getElementById('taskbar-windows'),
    taskbarClock: document.getElementById('taskbar-clock'),
    startBtn: document.getElementById('start-btn'),
    startMenu: document.getElementById('start-menu'),
    contextMenu: document.getElementById('context-menu'),
    crtToggle: document.getElementById('crt-toggle'),
    soundToggle: document.getElementById('sound-toggle'),
    mobileDrawer: document.getElementById('mobile-drawer'),
    mobileContent: document.getElementById('mobile-content'),
    mobileContentTitle: document.getElementById('mobile-content-title'),
    mobileContentBody: document.getElementById('mobile-content-body'),
    mobileBackBtn: document.getElementById('mobile-back-btn')
  };

  // ========================================
  // Sound Effects (optional)
  // ========================================

  const sounds = {
    click: null,
    open: null,
    close: null
  };

  function playSound(name) {
    if (!state.soundEnabled || !sounds[name]) return;
    try {
      sounds[name].currentTime = 0;
      sounds[name].play().catch(() => {});
    } catch (e) {}
  }

  // ========================================
  // Utility Functions
  // ========================================

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getWindowPosition(windowEl) {
    const desktop = elements.desktop.getBoundingClientRect();
    const windowWidth = 500;
    const windowHeight = 400;

    // Calculate centered position with some offset for cascading
    const openWindows = Object.keys(state.windows).length;
    const offset = openWindows * 30;

    const left = Math.max(50, (desktop.width - windowWidth) / 2 + offset);
    const top = Math.max(50, (desktop.height - windowHeight) / 2 + offset);

    return {
      left: clamp(left, 50, desktop.width - windowWidth - 50),
      top: clamp(top, 50, desktop.height - windowHeight - 100)
    };
  }

  // ========================================
  // Clock
  // ========================================

  function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    elements.taskbarClock.textContent = `${displayHours}:${minutes} ${ampm}`;
  }

  // ========================================
  // Window Management
  // ========================================

  function openWindow(windowId) {
    const windowEl = document.getElementById(`window-${windowId}`);
    if (!windowEl) return;

    // Check if already open
    if (state.windows[windowId]) {
      // Restore if minimized
      if (state.windows[windowId].minimized) {
        restoreWindow(windowId);
      }
      focusWindow(windowId);
      return;
    }

    // Position window
    const pos = getWindowPosition(windowEl);
    windowEl.style.left = `${pos.left}px`;
    windowEl.style.top = `${pos.top}px`;
    windowEl.style.width = '500px';
    windowEl.style.height = '400px';
    windowEl.style.display = 'flex';

    // Add resize handle
    if (!windowEl.querySelector('.resize-handle')) {
      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      windowEl.appendChild(handle);
    }

    // Track window state
    state.windows[windowId] = {
      minimized: false,
      maximized: false
    };

    // Focus window
    focusWindow(windowId);

    // Update taskbar
    updateTaskbar();

    // Play sound
    playSound('open');

    // Close start menu
    closeStartMenu();
  }

  function closeWindow(windowId) {
    const windowEl = document.getElementById(`window-${windowId}`);
    if (!windowEl) return;

    windowEl.style.display = 'none';
    windowEl.classList.remove('active', 'minimized', 'maximized');

    delete state.windows[windowId];

    if (state.activeWindow === windowId) {
      state.activeWindow = null;
      // Focus next available window
      const openWindows = Object.keys(state.windows);
      if (openWindows.length > 0) {
        focusWindow(openWindows[openWindows.length - 1]);
      }
    }

    updateTaskbar();
    playSound('close');
  }

  function minimizeWindow(windowId) {
    const windowEl = document.getElementById(`window-${windowId}`);
    if (!windowEl || !state.windows[windowId]) return;

    windowEl.classList.add('minimized');
    state.windows[windowId].minimized = true;

    setTimeout(() => {
      windowEl.style.display = 'none';
    }, 200);

    if (state.activeWindow === windowId) {
      state.activeWindow = null;
      windowEl.classList.remove('active');
    }

    updateTaskbar();
  }

  function restoreWindow(windowId) {
    const windowEl = document.getElementById(`window-${windowId}`);
    if (!windowEl || !state.windows[windowId]) return;

    windowEl.style.display = 'flex';
    windowEl.classList.remove('minimized');
    state.windows[windowId].minimized = false;

    focusWindow(windowId);
    updateTaskbar();
  }

  function maximizeWindow(windowId) {
    const windowEl = document.getElementById(`window-${windowId}`);
    if (!windowEl || !state.windows[windowId]) return;

    if (state.windows[windowId].maximized) {
      // Restore
      windowEl.classList.remove('maximized');
      state.windows[windowId].maximized = false;

      // Restore previous position
      if (state.windows[windowId].prevPos) {
        windowEl.style.left = state.windows[windowId].prevPos.left;
        windowEl.style.top = state.windows[windowId].prevPos.top;
        windowEl.style.width = state.windows[windowId].prevPos.width;
        windowEl.style.height = state.windows[windowId].prevPos.height;
      }
    } else {
      // Save current position
      state.windows[windowId].prevPos = {
        left: windowEl.style.left,
        top: windowEl.style.top,
        width: windowEl.style.width,
        height: windowEl.style.height
      };

      // Maximize
      windowEl.classList.add('maximized');
      state.windows[windowId].maximized = true;
    }

    focusWindow(windowId);
  }

  function focusWindow(windowId) {
    // Remove active from all windows
    document.querySelectorAll('.window').forEach(w => {
      w.classList.remove('active');
    });

    const windowEl = document.getElementById(`window-${windowId}`);
    if (!windowEl) return;

    // Set z-index and active state
    state.highestZIndex++;
    windowEl.style.zIndex = state.highestZIndex;
    windowEl.classList.add('active');
    state.activeWindow = windowId;

    updateTaskbar();
  }

  function updateTaskbar() {
    elements.taskbarWindows.innerHTML = '';

    Object.keys(state.windows).forEach(windowId => {
      const btn = document.createElement('button');
      btn.className = 'taskbar-window';
      if (state.activeWindow === windowId && !state.windows[windowId].minimized) {
        btn.classList.add('active');
      }

      const icon = document.querySelector(`#window-${windowId} .window-title i`);
      const iconClass = icon ? icon.className : 'fa-solid fa-window-maximize';

      btn.innerHTML = `<i class="${iconClass}"></i> ${windowTitles[windowId] || windowId}`;

      btn.addEventListener('click', () => {
        if (state.windows[windowId].minimized) {
          restoreWindow(windowId);
        } else if (state.activeWindow === windowId) {
          minimizeWindow(windowId);
        } else {
          focusWindow(windowId);
        }
      });

      elements.taskbarWindows.appendChild(btn);
    });
  }

  // ========================================
  // Window Dragging
  // ========================================

  function initDrag(windowEl, e) {
    if (e.target.closest('.window-btn')) return;

    const windowId = windowEl.id.replace('window-', '');
    if (state.windows[windowId]?.maximized) return;

    state.dragState = {
      windowEl,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: parseInt(windowEl.style.left) || 0,
      startTop: parseInt(windowEl.style.top) || 0
    };

    focusWindow(windowId);
    document.body.style.userSelect = 'none';
  }

  function handleDrag(e) {
    if (!state.dragState) return;

    const { windowEl, startX, startY, startLeft, startTop } = state.dragState;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const desktop = elements.desktop.getBoundingClientRect();
    const newLeft = clamp(startLeft + deltaX, 0, desktop.width - 100);
    const newTop = clamp(startTop + deltaY, 0, desktop.height - 50);

    windowEl.style.left = `${newLeft}px`;
    windowEl.style.top = `${newTop}px`;
  }

  function endDrag() {
    state.dragState = null;
    document.body.style.userSelect = '';
  }

  // ========================================
  // Icon Dragging
  // ========================================

  function initIconDrag(iconEl, e) {
    // Prevent text selection
    e.preventDefault();

    const rect = iconEl.getBoundingClientRect();
    const gridRect = elements.iconGrid.getBoundingClientRect();

    state.iconDragState = {
      iconEl,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: parseInt(iconEl.style.left) || (rect.left - gridRect.left),
      startTop: parseInt(iconEl.style.top) || (rect.top - gridRect.top),
      hasMoved: false,
      startTime: Date.now()
    };

    iconEl.classList.add('dragging');
    document.body.style.userSelect = 'none';
  }

  function handleIconDrag(e) {
    if (!state.iconDragState) return;

    const { iconEl, startX, startY, startLeft, startTop } = state.iconDragState;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Only start moving if dragged more than 5px (to distinguish from clicks)
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      state.iconDragState.hasMoved = true;
    }

    if (!state.iconDragState.hasMoved) return;

    const gridRect = elements.iconGrid.getBoundingClientRect();
    const iconWidth = iconEl.offsetWidth;
    const iconHeight = iconEl.offsetHeight;

    // Calculate new position with bounds checking
    const newLeft = clamp(startLeft + deltaX, 0, gridRect.width - iconWidth);
    const newTop = clamp(startTop + deltaY, 0, gridRect.height - iconHeight);

    iconEl.style.left = `${newLeft}px`;
    iconEl.style.top = `${newTop}px`;
  }

  function endIconDrag(e) {
    if (!state.iconDragState) return;

    const { iconEl, hasMoved, startTime } = state.iconDragState;

    iconEl.classList.remove('dragging');
    document.body.style.userSelect = '';

    // If it was a short click without movement, don't prevent the click
    const clickDuration = Date.now() - startTime;
    const wasClick = !hasMoved && clickDuration < 200;

    state.iconDragState = null;

    return wasClick;
  }

  // ========================================
  // Resizing
  // ========================================

  function initResize(windowEl, e) {
    const windowId = windowEl.id.replace('window-', '');
    if (state.windows[windowId]?.maximized) return;

    state.resizeState = {
      windowEl,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: windowEl.offsetWidth,
      startHeight: windowEl.offsetHeight
    };

    document.body.style.userSelect = 'none';
    e.preventDefault();
  }

  function handleResize(e) {
    if (!state.resizeState) return;

    const { windowEl, startX, startY, startWidth, startHeight } = state.resizeState;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newWidth = Math.max(400, startWidth + deltaX);
    const newHeight = Math.max(300, startHeight + deltaY);

    windowEl.style.width = `${newWidth}px`;
    windowEl.style.height = `${newHeight}px`;
  }

  function endResize() {
    state.resizeState = null;
    document.body.style.userSelect = '';
  }

  // ========================================
  // Start Menu
  // ========================================

  function toggleStartMenu() {
    const isHidden = elements.startMenu.classList.contains('hidden');

    if (isHidden) {
      elements.startMenu.classList.remove('hidden');
      elements.startBtn.classList.add('active');
    } else {
      closeStartMenu();
    }
  }

  function closeStartMenu() {
    elements.startMenu.classList.add('hidden');
    elements.startBtn.classList.remove('active');
  }

  // ========================================
  // Context Menu
  // ========================================

  function showContextMenu(x, y) {
    elements.contextMenu.classList.remove('hidden');

    const menuRect = elements.contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust position if menu would go off screen
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 10;
    }
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 10;
    }

    elements.contextMenu.style.left = `${x}px`;
    elements.contextMenu.style.top = `${y}px`;
  }

  function hideContextMenu() {
    elements.contextMenu.classList.add('hidden');
  }

  function handleContextAction(action) {
    switch (action) {
      case 'about-site':
        openWindow('about');
        break;
      case 'toggle-crt':
        toggleCRT();
        break;
      case 'toggle-sound':
        toggleSound();
        break;
      case 'refresh':
        location.reload();
        break;
    }
    hideContextMenu();
  }

  // ========================================
  // CRT Effect
  // ========================================

  function toggleCRT() {
    state.crtEnabled = !state.crtEnabled;

    if (state.crtEnabled) {
      elements.crtOverlay.classList.remove('hidden');
      elements.crtToggle.classList.add('active');
    } else {
      elements.crtOverlay.classList.add('hidden');
      elements.crtToggle.classList.remove('active');
    }
  }

  // ========================================
  // Sound Toggle
  // ========================================

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;

    if (state.soundEnabled) {
      elements.soundToggle.classList.remove('muted');
      elements.soundToggle.classList.add('active');
    } else {
      elements.soundToggle.classList.add('muted');
      elements.soundToggle.classList.remove('active');
    }
  }

  // ========================================
  // Mobile Support
  // ========================================

  function checkMobile() {
    const wasMobile = state.isMobile;
    state.isMobile = window.innerWidth < 768;

    if (state.isMobile !== wasMobile) {
      if (state.isMobile) {
        // Switch to mobile mode
        elements.desktop.classList.add('hidden');
        elements.taskbar.classList.add('hidden');
        elements.mobileDrawer.classList.remove('hidden');
        closeAllWindows();
      } else {
        // Switch to desktop mode
        elements.desktop.classList.remove('hidden');
        elements.taskbar.classList.remove('hidden');
        elements.mobileDrawer.classList.add('hidden');
        elements.mobileContent.classList.add('hidden');
      }
    }
  }

  function closeAllWindows() {
    Object.keys(state.windows).forEach(windowId => {
      closeWindow(windowId);
    });
  }

  function openMobileContent(windowId) {
    const windowEl = document.getElementById(`window-${windowId}`);
    if (!windowEl) return;

    const content = windowEl.querySelector('.window-content');
    if (!content) return;

    elements.mobileContentTitle.textContent = windowTitles[windowId] || windowId;
    elements.mobileContentBody.innerHTML = content.innerHTML;

    elements.mobileDrawer.classList.add('hidden');
    elements.mobileContent.classList.remove('hidden');
  }

  function closeMobileContent() {
    elements.mobileContent.classList.add('hidden');
    elements.mobileDrawer.classList.remove('hidden');
  }

  // ========================================
  // Event Listeners
  // ========================================

  function initEventListeners() {
    // Desktop icons - dragging and clicking
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      // Mouse down to start drag
      icon.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Only left click
        initIconDrag(icon, e);
      });

      // Double click to open
      icon.addEventListener('dblclick', (e) => {
        const windowId = icon.dataset.window;
        const link = icon.dataset.link;

        if (link) {
          window.open(link, '_blank', 'noopener noreferrer');
        } else if (windowId) {
          openWindow(windowId);
        }

        playSound('click');
      });

      // Single click to select (only if not dragging)
      icon.addEventListener('click', (e) => {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
      });
    });

    // Window controls
    document.querySelectorAll('.window').forEach(windowEl => {
      const windowId = windowEl.id.replace('window-', '');
      const titlebar = windowEl.querySelector('.window-titlebar');
      const closeBtn = windowEl.querySelector('.close-btn');
      const minimizeBtn = windowEl.querySelector('.minimize-btn');
      const maximizeBtn = windowEl.querySelector('.maximize-btn');
      const resizeHandle = windowEl.querySelector('.resize-handle');

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeWindow(windowId);
        });
      }

      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          minimizeWindow(windowId);
        });
      }

      if (maximizeBtn) {
        maximizeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          maximizeWindow(windowId);
        });

        // Double-click titlebar to maximize
        if (titlebar) {
          titlebar.addEventListener('dblclick', () => {
            maximizeWindow(windowId);
          });
        }
      }

      // Dragging
      if (titlebar) {
        titlebar.addEventListener('mousedown', (e) => initDrag(windowEl, e));
      }

      // Resizing
      if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', (e) => initResize(windowEl, e));
      }

      // Focus on click
      windowEl.addEventListener('mousedown', () => focusWindow(windowId));
    });

    // Global mouse events for dragging/resizing (windows and icons)
    document.addEventListener('mousemove', (e) => {
      handleDrag(e);
      handleResize(e);
      handleIconDrag(e);
    });

    document.addEventListener('mouseup', (e) => {
      endDrag();
      endResize();
      endIconDrag(e);
    });

    // Start button
    elements.startBtn.addEventListener('click', toggleStartMenu);

    // Start menu items
    document.querySelectorAll('.start-item').forEach(item => {
      item.addEventListener('click', () => {
        const windowId = item.dataset.window;
        if (windowId) {
          if (state.isMobile) {
            openMobileContent(windowId);
          } else {
            openWindow(windowId);
          }
        }
        closeStartMenu();
      });
    });

    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
        closeStartMenu();
      }
      if (!e.target.closest('#context-menu')) {
        hideContextMenu();
      }
    });

    // Context menu
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('#desktop') || e.target.closest('#desktop-wallpaper')) {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
      }
    });

    document.querySelectorAll('.context-item').forEach(item => {
      item.addEventListener('click', () => {
        handleContextAction(item.dataset.action);
      });
    });

    // CRT toggle
    elements.crtToggle.addEventListener('click', toggleCRT);

    // Sound toggle
    elements.soundToggle.addEventListener('click', toggleSound);

    // Mobile drawer apps
    document.querySelectorAll('.drawer-app').forEach(app => {
      app.addEventListener('click', () => {
        const windowId = app.dataset.window;
        if (windowId) {
          openMobileContent(windowId);
        }
      });
    });

    // Mobile back button
    elements.mobileBackBtn.addEventListener('click', closeMobileContent);

    // Responsive
    window.addEventListener('resize', checkMobile);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape to close active window
      if (e.key === 'Escape') {
        if (state.activeWindow) {
          closeWindow(state.activeWindow);
        }
        closeStartMenu();
        hideContextMenu();
      }
    });

    // Click on desktop to deselect icons
    elements.desktop.addEventListener('click', (e) => {
      if (e.target === elements.desktop || e.target === elements.iconGrid) {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      }
    });
  }

  // ========================================
  // Initialization
  // ========================================

  function init() {
    // Update clock immediately and then every minute
    updateClock();
    setInterval(updateClock, 1000);

    // Check mobile state
    checkMobile();

    // Initialize event listeners
    initEventListeners();

    // Set initial sound toggle state
    elements.soundToggle.classList.add('active');

    // Remove boot screen after animation
    setTimeout(() => {
      if (elements.bootScreen) {
        elements.bootScreen.remove();
      }
    }, 3500);

    console.log('VineetOS initialized');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
