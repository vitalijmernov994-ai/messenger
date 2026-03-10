import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'imsitchat-theme';
const STORAGE_THEME_COLOR = 'imsitchat-theme-color';
const STORAGE_BG_IMAGE = 'imsitchat-theme-bg-image';
const STORAGE_BG_VIDEO = 'imsitchat-theme-bg-video';

const ThemeContext = createContext<{
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  effectiveDark: boolean;
  customThemeColor: string | null;
  setCustomThemeColor: (c: string | null) => void;
  customBackgroundImage: string | null;
  setCustomBackgroundImage: (url: string | null) => void;
  customBackgroundVideo: string | null;
  setCustomBackgroundVideo: (url: string | null) => void;
  hasGlassUI: boolean;
}>(null!);

function readStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light' || v === 'system') return v;
  } catch {}
  return 'light';
}

function readStoredThemeColor(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_THEME_COLOR);
    if (v && /^#[0-9A-Fa-f]{6}$/.test(v)) return v;
  } catch {}
  return null;
}

function readStoredBgImage(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_BG_IMAGE);
    if (v && v.startsWith('data:')) return v;
  } catch {}
  return null;
}

function readStoredBgVideo(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_BG_VIDEO);
    if (v && v.length > 0 && v.length < 2000) return v;
  } catch {}
  return null;
}

function hexLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 0xff}, ${(n >> 8) & 0xff}, ${n & 0xff}`;
}

function darkenHex(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) * factor);
  const g = Math.round(((n >> 8) & 0xff) * factor);
  const b = Math.round((n & 0xff) * factor);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function lightenHex(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((n & 0xff) * factor));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [customThemeColor, setCustomThemeColorState] = useState<string | null>(readStoredThemeColor);
  const [customBackgroundImage, setCustomBackgroundImageState] = useState<string | null>(readStoredBgImage);
  const [customBackgroundVideo, setCustomBackgroundVideoState] = useState<string | null>(readStoredBgVideo);

  const effectiveDark = theme === 'dark' || (theme === 'system' && systemDark);

  useEffect(() => {
    const m = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(m.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (effectiveDark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, effectiveDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (customThemeColor) {
      const lum = hexLuminance(customThemeColor);
      const isVeryDark = lum < 0.2;
      root.style.setProperty('--theme-bg', customThemeColor);
      root.style.setProperty('--theme-bg-rgb', hexToRgb(customThemeColor));
      if (isVeryDark) {
        const card = lum < 0.02 ? '#1c1c1c' : lightenHex(customThemeColor, 1.35);
        const header = lum < 0.02 ? '#161616' : lightenHex(customThemeColor, 1.25);
        const inputBg = lum < 0.02 ? '#2d2d2d' : lightenHex(customThemeColor, 1.7);
        const inputBorder = lum < 0.02 ? '#454545' : lightenHex(customThemeColor, 2.2);
        const buttonBg = lum < 0.02 ? '#3a3a3a' : lightenHex(customThemeColor, 1.9);
        root.style.setProperty('--theme-card', card);
        root.style.setProperty('--theme-header', header);
        root.style.setProperty('--theme-input-bg', inputBg);
        root.style.setProperty('--theme-input-border', inputBorder);
        root.style.setProperty('--theme-button-bg', buttonBg);
      } else {
        root.style.setProperty('--theme-card', darkenHex(customThemeColor, 0.82));
        root.style.setProperty('--theme-header', darkenHex(customThemeColor, 0.88));
        root.style.setProperty('--theme-input-bg', darkenHex(customThemeColor, 0.45));
        root.style.setProperty('--theme-input-border', darkenHex(customThemeColor, 0.35));
        root.style.setProperty('--theme-button-bg', darkenHex(customThemeColor, 0.4));
      }
      root.style.setProperty('--theme-button-text', '#f8fafc');
      root.style.setProperty('--theme-input-text', '#f8fafc');
      root.style.setProperty('--theme-input-placeholder', 'rgba(248,250,252,0.6)');
      localStorage.setItem(STORAGE_THEME_COLOR, customThemeColor);
      root.setAttribute('data-theme-color', 'on');
    } else {
      root.style.removeProperty('--theme-bg');
      root.style.removeProperty('--theme-bg-rgb');
      root.style.removeProperty('--theme-card');
      root.style.removeProperty('--theme-header');
      root.style.removeProperty('--theme-input-bg');
      root.style.removeProperty('--theme-input-border');
      root.style.removeProperty('--theme-button-bg');
      root.style.removeProperty('--theme-button-text');
      root.style.removeProperty('--theme-input-text');
      root.style.removeProperty('--theme-input-placeholder');
      localStorage.removeItem(STORAGE_THEME_COLOR);
      root.removeAttribute('data-theme-color');
    }
  }, [customThemeColor]);

  useEffect(() => {
    if (customBackgroundImage) localStorage.setItem(STORAGE_BG_IMAGE, customBackgroundImage);
    else localStorage.removeItem(STORAGE_BG_IMAGE);
  }, [customBackgroundImage]);

  useEffect(() => {
    if (customBackgroundVideo) localStorage.setItem(STORAGE_BG_VIDEO, customBackgroundVideo);
    else localStorage.removeItem(STORAGE_BG_VIDEO);
  }, [customBackgroundVideo]);

  const setTheme = (t: ThemeMode) => setThemeState(t);
  const setCustomThemeColor = (c: string | null) => setCustomThemeColorState(c);
  const setCustomBackgroundImage = (url: string | null) => setCustomBackgroundImageState(url);
  const setCustomBackgroundVideo = (url: string | null) => setCustomBackgroundVideoState(url);

  const hasGlassUI = !!(customBackgroundImage || customBackgroundVideo);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        effectiveDark,
        customThemeColor,
        setCustomThemeColor,
        customBackgroundImage,
        setCustomBackgroundImage,
        customBackgroundVideo,
        setCustomBackgroundVideo,
        hasGlassUI,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
