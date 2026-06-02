import React from 'react';
import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { User, Menu, Globe, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Logo />
        
        <nav className="hidden lg:flex items-center gap-8">
          <Link href="/cars" className="text-sm font-medium hover:text-primary transition-colors">Find a Car</Link>
          <Link href="/destinations" className="text-sm font-medium hover:text-primary transition-colors">Destinations</Link>
          <Link href="/deals" className="text-sm font-medium hover:text-primary transition-colors">Exclusive Deals</Link>
          <Link href="/help" className="text-sm font-medium hover:text-primary transition-colors">Support</Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Globe className="h-5 w-5" />
          </Button>
          <Button variant="ghost" className="hidden sm:flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            <span className="text-sm">Help</span>
          </Button>
          <div className="h-6 w-px bg-gray-200 hidden sm:block mx-1"></div>
          <Button variant="outline" className="rounded-full hidden sm:flex">
            Sign In
          </Button>
          <Button className="rounded-full">
            Get Started
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

import Link from 'next/link';
export default Header;
