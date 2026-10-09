import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  ariaLabelledBy = 'modal-title',
  className = '',
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };

    // Lock background scroll when open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClass} bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, onClose, className = '' }) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70 ${className}`}
    >
      <div className="flex-1 min-w-0 pr-4">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="p-1.5 -mr-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function ModalTitle({ id = 'modal-title', children, className = '' }) {
  return (
    <h2 id={id} className={`text-base font-bold text-slate-900 tracking-tight ${className}`}>
      {children}
    </h2>
  );
}

export function ModalDescription({ children, className = '' }) {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 ${className}`}>
      {children}
    </p>
  );
}

export function ModalBody({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div
      className={`px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5 ${className}`}
    >
      {children}
    </div>
  );
}

export default {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
};
