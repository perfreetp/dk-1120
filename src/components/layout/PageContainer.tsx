import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  showPadding?: boolean;
}

export function PageContainer({ 
  children, 
  className = '', 
  showPadding = true 
}: PageContainerProps) {
  return (
    <main className={`min-h-screen bg-background ${showPadding ? 'pb-20' : ''} ${className}`}>
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
        {children}
      </div>
    </main>
  );
}
