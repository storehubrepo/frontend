'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'medium',
  hover = false,
}) => {
  const paddingStyles = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 ${
        paddingStyles[padding]
      } ${hover ? 'transition-shadow hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
