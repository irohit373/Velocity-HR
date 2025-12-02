// Mark as client component for interactivity (needed for useState)
"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
// Mobile Toogle menu variable 
  // State to track mobile menu open/close
  const [isOpen, setIsOpen] = useState(false);
  // Toggle mobile menu state
  const toggleMenu = () => setIsOpen(!isOpen);
  // Close mobile menu
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="shadow-md">
      {/* Main navbar container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-1 lg:px-1">
        <div className="flex justify-between items-center h-16">
          
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <img src="/favicon.ico" alt="VELOCITY H" className="w-12 h-12" />
            </Link>
          </div>

          {/* Center: Brand Name (visible only on desktop) */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-2xl bg-clip-text">VELOCITY H</h1>
          </div>

          {/* Right: Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/jobs"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium transition-colors"
            >
              Job List
            </Link>
            <Link
              href="/signup"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/signin"
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Login
            </Link>
          </div>

          {/* Mobile: Hamburger Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              
              {/* Show hamburger icon when menu is closed, X icon when open */}
              {!isOpen ? (
                // Hamburger Icon
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                // Close Icon (X)
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown (shown when isOpen is true) */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            
            {/* Brand name for mobile */}
            <div className="text-center py-2">
              <h1 className="text-xl bg-clip-text">VELOCITY H</h1>
            </div>

            {/* Mobile Navigation Links */}
            <Link
              href="/jobs"
              className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={closeMenu}
            >
              Job List
            </Link>
            <Link
              href="/signup"
              className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={closeMenu}
            >
              Sign Up
            </Link>
            <Link
              href="/signin"
              className="bg-blue-600 text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium text-center"
              onClick={closeMenu}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
