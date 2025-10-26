'use client';

import dynamic from 'next/dynamic';
import React from 'react';

interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const NoSSRWrapper = ({ children, fallback }: NoSSRProps) => {
  return <>{children}</>;
};

// Export a dynamically imported version that disables SSR
const NoSSR = dynamic(() => Promise.resolve(NoSSRWrapper), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ),
});

export default NoSSR;