'use client';

import { ReactNode } from 'react';

interface CRMLayoutProps {
  children: ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  return (
    <div className="min-h-screen bg-black">
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
