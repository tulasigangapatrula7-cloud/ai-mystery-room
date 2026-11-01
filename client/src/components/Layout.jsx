// client/src/components/Layout.jsx
// The frame around every page: header, footer, and scroll-to-top.

import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Fingerprint, FolderOpen } from "lucide-react";
import { getCurrentCase } from "../services/api.js";

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "text-gold-300" : "text-slate-300 hover:text-gold-300"
  }`;

export default function Layout() {
  const location = useLocation();
  const currentCase = getCurrentCase(); // re-read on every page change

  // Start each new page at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold-400 focus:px-3 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2" aria-label="AI Mystery Room, home">
            <Fingerprint className="h-7 w-7 text-gold-400" aria-hidden="true" />
            <span className="font-display text-lg font-bold text-slate-50 sm:text-xl">
              AI Mystery <span className="text-gold-400">Room</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Main">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            {currentCase && (
              <Link
                to={`/case/${currentCase}`}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gold-300 hover:text-gold-400"
              >
                <FolderOpen className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Current case</span>
                <span className="sm:hidden">Case</span>
              </Link>
            )}
            <Link to="/create" className="btn-gold ml-1 !px-4 !py-2">
              New Case
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>AI Mystery Room. Every case is written by AI, so every case is new.</p>
      </footer>
    </div>
  );
}
