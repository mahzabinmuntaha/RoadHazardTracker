/**
 * ====================================================================
 * Road Hazard Reporting & Tracking System
 * Global Theme & Branding Engine (Persistent Across All Pages)
 * Controlled exclusively by Administrators
 * ====================================================================
 */

(function () {
  // Built-in Curated Civic & Government Theme Presets
  const THEME_PRESETS = {
    'neo-teal': {
      id: 'neo-teal',
      name: 'Emerald Teal & Amber (Default)',
      description: 'Official Dhaka Civic & Infrastructure safety palette',
      primary: '#0f766e',
      primaryHover: '#115e59',
      primaryLight: '#f0fdfa',
      accent: '#f59e0b',
      accentHover: '#d97706',
      accentLight: '#fffbeb',
      badge: 'Civic Default'
    },
    'metro-navy': {
      id: 'metro-navy',
      name: 'Metropolitan Navy & Cyan',
      description: 'Smart transit, municipal police & rapid transport aesthetic',
      primary: '#1e3a8a',
      primaryHover: '#172554',
      primaryLight: '#eff6ff',
      accent: '#06b6d4',
      accentHover: '#0891b2',
      accentLight: '#ecfeff',
      badge: 'Smart City'
    },
    'safety-amber': {
      id: 'safety-amber',
      name: 'Safety Amber & Crimson',
      description: 'High-visibility highway traffic hazard & emergency alert theme',
      primary: '#b45309',
      primaryHover: '#92400e',
      primaryLight: '#fffbeb',
      accent: '#dc2626',
      accentHover: '#b91c1c',
      accentLight: '#fef2f2',
      badge: 'Emergency Ops'
    },
    'royal-indigo': {
      id: 'royal-indigo',
      name: 'Digital Indigo & Rose',
      description: 'Modern modern digital civic portal with vibrant contrast',
      primary: '#4338ca',
      primaryHover: '#3730a3',
      primaryLight: '#eef2ff',
      accent: '#e11d48',
      accentHover: '#be123c',
      accentLight: '#fff1f2',
      badge: 'Modern Gov'
    },
    'eco-green': {
      id: 'eco-green',
      name: 'Clean City Forest & Lime',
      description: 'Dhaka green roads, environmental drainage & urban ecology',
      primary: '#15803d',
      primaryHover: '#166534',
      primaryLight: '#f0fdf4',
      accent: '#65a30d',
      accentHover: '#4d7c0f',
      accentLight: '#f7fee7',
      badge: 'Eco Civic'
    },
    'midnight-cyber': {
      id: 'midnight-cyber',
      name: 'Night Ops Slate & Electric Sky',
      description: 'Night shift incident response and high-contrast control center',
      primary: '#0e7490',
      primaryHover: '#155e75',
      primaryLight: '#ecfeff',
      accent: '#0284c7',
      accentHover: '#0369a1',
      accentLight: '#f0f9ff',
      badge: 'Night Ops'
    }
  };

  // Color calculation helpers
  function hexToRgb(hex) {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function adjustBrightness(hex, percent) {
    const { r, g, b } = hexToRgb(hex);
    const amt = Math.round(2.55 * percent);
    const clamp = (val) => Math.min(255, Math.max(0, val));
    const newR = clamp(r + amt);
    const newG = clamp(g + amt);
    const newB = clamp(b + amt);
    return '#' + ((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1);
  }

  function createLightTint(hex) {
    const { r, g, b } = hexToRgb(hex);
    // Blend 92% white
    const nr = Math.round(r * 0.08 + 255 * 0.92);
    const ng = Math.round(g * 0.08 + 255 * 0.92);
    const nb = Math.round(b * 0.08 + 255 * 0.92);
    return '#' + ((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1);
  }

  function applyCssVariables(themeObj) {
    const root = document.documentElement;
    const primaryRgb = hexToRgb(themeObj.primary);
    const accentRgb = hexToRgb(themeObj.accent);

    root.style.setProperty('--color-primary', themeObj.primary);
    root.style.setProperty('--color-primary-hover', themeObj.primaryHover || adjustBrightness(themeObj.primary, -15));
    root.style.setProperty('--color-primary-light', themeObj.primaryLight || createLightTint(themeObj.primary));
    root.style.setProperty('--color-primary-glow', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.25)`);

    root.style.setProperty('--color-accent', themeObj.accent);
    root.style.setProperty('--color-accent-hover', themeObj.accentHover || adjustBrightness(themeObj.accent, -15));
    root.style.setProperty('--color-accent-light', themeObj.accentLight || createLightTint(themeObj.accent));
    root.style.setProperty('--color-accent-glow', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.28)`);
    root.style.setProperty('--border-focus', themeObj.primary);
  }

  // Load and apply active theme immediately (prevents flash of default colors)
  function initTheme() {
    try {
      const stored = localStorage.getItem('RH_SITE_THEME');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.primary && parsed.accent) {
          applyCssVariables(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored theme:', e);
    }
  }

  // Expose global Theme Manager API
  window.themeManager = {
    getPresets: () => THEME_PRESETS,

    getCurrentTheme: () => {
      try {
        const stored = localStorage.getItem('RH_SITE_THEME');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return { ...THEME_PRESETS['neo-teal'], isDefault: true };
    },

    applyPreset: (presetId) => {
      const preset = THEME_PRESETS[presetId];
      if (!preset) return false;
      const themeConfig = {
        id: preset.id,
        name: preset.name,
        primary: preset.primary,
        primaryHover: preset.primaryHover,
        primaryLight: preset.primaryLight,
        accent: preset.accent,
        accentHover: preset.accentHover,
        accentLight: preset.accentLight,
        updatedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem('RH_SITE_THEME', JSON.stringify(themeConfig));
      } catch (e) {}
      applyCssVariables(themeConfig);
      return themeConfig;
    },

    applyCustom: (primaryHex, accentHex, customName = 'Custom Admin Palette') => {
      if (!primaryHex || !accentHex) return false;
      const themeConfig = {
        id: 'custom-' + Date.now(),
        name: customName,
        primary: primaryHex,
        primaryHover: adjustBrightness(primaryHex, -15),
        primaryLight: createLightTint(primaryHex),
        accent: accentHex,
        accentHover: adjustBrightness(accentHex, -15),
        accentLight: createLightTint(accentHex),
        isCustom: true,
        updatedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem('RH_SITE_THEME', JSON.stringify(themeConfig));
      } catch (e) {}
      applyCssVariables(themeConfig);
      return themeConfig;
    },

    resetToDefault: () => {
      try {
        localStorage.removeItem('RH_SITE_THEME');
      } catch (e) {}
      const def = THEME_PRESETS['neo-teal'];
      applyCssVariables(def);
      return def;
    }
  };

  // Run immediately on script evaluation
  initTheme();
})();
