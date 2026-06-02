import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  light?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className, light }) => {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 420 90" xmlns="http://www.w3.org/2000/svg" className="h-8 md:h-10 w-auto">
        {/* Icon Circle */}
        <circle cx="45" cy="45" r="24" fill={light ? "#FFFFFF" : "#0F172A"}/>
      
        {/* Car Roofline */}
        <path d="M28 48 Q45 30 62 42"
              stroke="#F97316"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"/>
      
        {/* Base Line */}
        <line x1="35" y1="55" x2="55" y2="55"
              stroke="#F97316"
              strokeWidth="4"
              strokeLinecap="round"/>
      
        {/* Brand Name */}
        <text x="80" y="55"
              fontFamily="Inter, Arial, sans-serif"
              fontSize="38"
              fontWeight="800"
              letterSpacing="1"
              fill={light ? "#FFFFFF" : "#0F172A"}>
          HOGI<tspan fill="#F97316">CAR</tspan>
          <tspan fontSize="20" fill="#F97316">.com</tspan>
        </text>
      </svg>
    </Link>
  );
};

export default Logo;
