import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'dark' }) => {
  const primaryColor = variant === 'dark' ? '#123C69' : '#FFFFFF';
  const accentColor = '#F57C00';
  const circleColor = '#123C69';

  return (
    <svg
      viewBox="0 0 1200 200"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon Circle */}
      <circle cx="100" cy="100" r="55" fill={circleColor}/>
      {/* Car Roofline */}
      <path
        d="M60 105 Q100 65 140 95"
        stroke={accentColor}
        strokeWidth="16"
        fill="none"
        strokeLinecap="round"
      />
      {/* Base Line */}
      <line
        x1="75" y1="120" x2="125" y2="120"
        stroke={accentColor}
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Brand Name */}
      <text
        x="190" y="125"
        fontFamily="Montserrat, Arial, sans-serif"
        fontSize="140"
        fontWeight="700"
        letterSpacing="4"
        fill={primaryColor}
      >
        HOGI<tspan fill={accentColor}>CAR</tspan>
        <tspan fontSize="70" fill={accentColor}>.com</tspan>
      </text>
    </svg>
  );
};
