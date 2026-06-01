import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'dark' }) => {
  const primaryColor = variant === 'dark' ? '#0A2647' : '#FFFFFF';
  const accentColor = '#D4AF37';

  return (
    <svg
      viewBox="0 0 1200 240"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M40 120 L100 60 L160 120 L100 180 Z" fill={accentColor}/>
      <path d="M70 120 L100 90 L130 120 L100 150 Z" fill={primaryColor}/>
      <text x="200" y="165" fontFamily="Inter, system-ui, sans-serif" fontSize="180" fontWeight="800" letterSpacing="-4" fill={primaryColor}>
        Rent<tspan fill={accentColor}>Compare</tspan>
      </text>
    </svg>
  );
};
