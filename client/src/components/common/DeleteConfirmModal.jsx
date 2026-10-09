import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from './Modal';
import Button from './Button';

export default function DeleteConfirmModal({
  isOpen,
  title = 'Delete Lead',
  message = 'Are you sure you want to permanently delete this lead? This action cannot be undone.',
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onCancel}
      size="md"
      ariaLabelledBy="delete-modal-title"
    >
      <ModalBody className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs">
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <h3 id="delete-modal-title" className="text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          loading={loading}
          icon={Trash2}
          onClick={onConfirm}
        >
          {loading ? 'Deleting...' : 'Confirm Delete'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
