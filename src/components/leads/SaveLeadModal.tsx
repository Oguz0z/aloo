'use client';

import { CheckCircle, X, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';

interface SaveLeadModalProps {
  isOpen: boolean;
  businessName: string;
  onClose: () => void;
  onViewCRM: () => void;
}

export function SaveLeadModal({ isOpen, businessName, onClose, onViewCRM }: SaveLeadModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Auto-close after 4 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">Lead Saved to CRM!</h3>
          <p className="text-gray-400">
            <span className="text-white font-medium">{businessName}</span> has been added to your
            leads pipeline.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onViewCRM}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            View in CRM
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-700/50 transition-colors"
          >
            Continue Browsing
          </button>
        </div>

        {/* Auto-close indicator */}
        <div className="mt-4 flex justify-center">
          <div className="h-1 w-24 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full animate-shrink-width" />
          </div>
        </div>
      </div>
    </div>
  );
}
