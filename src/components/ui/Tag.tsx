import React from 'react';

interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  className?: string;
  onRemove?: () => void;
}

export function Tag({ children, variant = 'default', className = '', onRemove }: TagProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-text-secondary',
    primary: 'bg-primary bg-opacity-10 text-primary',
    secondary: 'bg-secondary bg-opacity-10 text-secondary',
    danger: 'bg-danger bg-opacity-10 text-danger',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${variantClasses[variant]} ${className}`}>
      {children}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
          ×
        </button>
      )}
    </span>
  );
}
