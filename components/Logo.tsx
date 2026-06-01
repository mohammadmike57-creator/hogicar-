import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'dark' }) => {
  const primaryColor = variant === 'dark' ? '#123C69' : '#FFFFFF';
  const accentColor = '#F57C00';

  return (
    <svg
      viewBox="0 0 420 90"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon Circle */}
      <circle cx="45" cy="45" r="24" fill={primaryColor}/>

      {/* Car Roofline */}
      <path d="M28 48 Q45 30 62 42"
            stroke={accentColor}
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"/>

      {/* Base Line */}
      <line x1="35" y1="55" x2="55" y2="55"
            stroke={accentColor}
            strokeWidth="4"
            strokeLinecap="round"/>

      {/* Brand Name */}
      <text x="80" y="55"
            fontFamily="Montserrat, Arial, sans-serif"
            fontSize="38"
            fontWeight="700"
            letterSpacing="1"
            fill={primaryColor}>
        HOGI<tspan fill={accentColor}>CAR</tspan>
        <tspan fontSize="20" fill={accentColor}>.com</tspan>
      </text>
    </svg>
  );
};
