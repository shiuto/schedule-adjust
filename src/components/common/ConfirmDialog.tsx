import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({ title, message, onConfirm, onCancel, danger }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <div className="flex gap-3 mb-5">
        {danger && <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />}
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          キャンセル
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-sm rounded-lg text-white font-medium ${
            danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          削除する
        </button>
      </div>
    </Modal>
  );
}
