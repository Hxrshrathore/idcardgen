'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, CreditCard } from 'lucide-react';

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <nav
      className="
        fixed top-0 left-0 right-0 z-50
        flex items-center justify-between
        px-6 h-14
        border-b
        backdrop-blur-md
        transition-colors duration-300
        theme-navbar
      "
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 flex items-center justify-center border theme-logo-border theme-logo-bg">
          <CreditCard className="w-3.5 h-3.5 theme-logo-icon" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-black tracking-tight uppercase theme-text-primary">
            ID Card Studio
          </span>
          <span className="text-[8px] uppercase tracking-widest theme-text-muted font-mono">
            CR80 Generator
          </span>
        </div>
      </div>

      {/* Right: nav links + toggle */}
      <div className="flex items-center gap-4">
        <a
          href="#"
          className="hidden sm:block text-[11px] font-semibold uppercase tracking-wider theme-text-muted hover:theme-text-primary transition-colors"
        >
          Docs
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:block text-[11px] font-semibold uppercase tracking-wider theme-text-muted hover:theme-text-primary transition-colors"
        >
          GitHub
        </a>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle theme"
          className="
            relative w-14 h-7 flex items-center
            border rounded-full px-1
            transition-all duration-300 cursor-pointer
            theme-toggle
          "
        >
          {/* Track pill */}
          <span
            className={`
              absolute left-1 w-5 h-5 rounded-full
              flex items-center justify-center
              transition-all duration-300 shadow-sm
              theme-toggle-thumb
              ${isLight ? 'translate-x-7' : 'translate-x-0'}
            `}
          >
            {isLight
              ? <Sun className="w-3 h-3 text-amber-500" />
              : <Moon className="w-3 h-3 text-zinc-300" />
            }
          </span>
          {/* Off-side icon */}
          <span className={`ml-auto mr-1 transition-opacity duration-300 ${isLight ? 'opacity-40' : 'opacity-0'}`}>
            <Moon className="w-2.5 h-2.5 theme-text-muted" />
          </span>
          <span className={`absolute left-2 transition-opacity duration-300 ${isLight ? 'opacity-0' : 'opacity-40'}`}>
            <Sun className="w-2.5 h-2.5 theme-text-muted" />
          </span>
        </button>
      </div>
    </nav>
  );
}
