import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ className = "h-12 w-auto", variant = 'dark' }) => {
  const primaryColor = variant === 'dark' ? '#123C69' : '#FFFFFF';
  const accentColor = '#F57C00';
  const circleColor = '#123C69';

  return (
    <svg 
      className={className} 
      viewBox="45 0 595 180" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon Circle */}
      <circle cx="100" cy="90" r="50" fill={circleColor}/>
      {/* Sleek Car Roofline */}
      <path 
        d="M60 95 Q100 60 140 85"
        stroke={accentColor}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Subtle Base Line */}
      <line 
        x1="75" y1="105" x2="125" y2="105"
        stroke={accentColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Brand Name + Integrated .com */}
      <text 
        x="165" y="102"
        fontFamily="Montserrat, Arial, sans-serif"
        fontSize="52"
        fontWeight="700"
        letterSpacing="1.2"
        fill={primaryColor}
      >
        HOGI<tspan fill={accentColor}>CAR</tspan><tspan fontSize="28" fill={accentColor}>.com</tspan>
      </text>
    </svg>
  );
};
