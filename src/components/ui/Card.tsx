import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', onClick, hoverable = false, style }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-xl shadow-soft p-4 transition-all duration-200 ${
        hoverable ? 'hover:shadow-hover hover:-translate-y-1 cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
