'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Search className="w-6 h-6 text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-200 mb-2">No leads found</h3>
      <p className="text-gray-500 text-center mb-6 max-w-sm">
        Start by searching for businesses in your area to add them as leads.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-gray-200 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
      >
        New Search
      </Link>
    </div>
  );
}
