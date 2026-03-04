import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'dark' }) => {
  const color = variant === 'light' ? 'text-white' : 'text-gray-900';
  return (
    <div className={`font-bold ${color} ${className}`}>
      <span className="text-orange-600">Hogi</span>Car
    </div>
  );
};
