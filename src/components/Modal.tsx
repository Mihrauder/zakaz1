"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0b111a] border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-in shadow-2xl shadow-blue-500/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          {title && <h2 className="text-xl font-semibold text-white animate-fade-in-up delay-100">{title}</h2>}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all duration-300 p-2 hover:bg-slate-700 rounded-lg hover:scale-110"
            aria-label="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 animate-fade-in-up delay-200">
          {children}
        </div>
      </div>
    </div>
  );
}
