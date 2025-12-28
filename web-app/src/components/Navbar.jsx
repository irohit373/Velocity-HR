"use client";

import Link from "next/link";
import { useUser } from "@/providers/UserProvider";
import { motion } from "framer-motion";
import UserDropdown from "./UserDropdown";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const user = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/signin';
  };

  return (
    <nav className="navbar bg-base-100 border-b px-4 lg:px-8 sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-base-100/95">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost gap-2 text-lg font-bold">
          <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
          <span className="hidden sm:inline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            VELOCITY H
          </span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="flex-none hidden lg:flex gap-2">
        <Link href="/jobs" className="btn btn-ghost">
          Jobs
        </Link>

        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-square"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
          
        {user ? (
          <UserDropdown user={user} />
        ) : (
          <div className="flex gap-2">
            <Link href="/signup" className="btn btn-ghost">
              Sign Up
            </Link>
            <Link href="/signin" className="btn btn-primary">
              Login
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="flex-none lg:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="btn btn-ghost btn-sm btn-square"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-64 bg-base-100 shadow-xl border-l"
            style={{ backgroundColor: 'var(--fallback-b1,oklch(var(--b1)))' }}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <span className="text-lg font-bold">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-ghost btn-sm btn-square"
              >
                <X size={20} />
              </button>
            </div>

            <ul className="menu p-4 gap-1">
              <li>
                <Link
                  href="/jobs"
                  className="font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Jobs
                </Link>
              </li>

              {/* Theme Toggle in Mobile Menu */}
              <li>
                <button
                  onClick={toggleTheme}
                  className="font-medium flex items-center gap-2"
                >
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
              </li>

              {user ? (
                <>
                  <li className="menu-title mt-4">Account</li>
                  <li>
                    <div className="p-3 bg-base-200 rounded-lg pointer-events-none">
                      <div className="font-semibold">{user.name || 'User'}</div>
                      <div className="text-xs opacity-70">{user.email}</div>
                    </div>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/recruitment"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Recruitment
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/scheduling"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Scheduling
                    </Link>
                  </li>
                  <li className="mt-2">
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-error font-medium"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="mt-4">
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signin"
                      className="btn btn-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </motion.div>
        </div>
      )}
    </nav>
  );
}
