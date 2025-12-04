'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();
  
  // Don't show navbar on auth pages
  const hideNavbar = pathname === '/signin' || pathname === '/signup';
  
  if (hideNavbar) return null;
  
  return <Navbar />;
}