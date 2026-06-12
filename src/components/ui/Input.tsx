import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-danger mt-1">{error}</p>
      )}
    </div>
  );
}
