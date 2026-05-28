import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Event } from '../../types';
import { useStore } from '../../store/useStore';
import { Plus, X } from 'lucide-react';

interface EventModalProps {
  event?: Event;
  onClose: () => void;
}

export function EventModal({ event, onClose }: EventModalProps) {
  const { addEvent, updateEvent } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState(event?.name || '');
  const [description, setDescription] = useState(event?.description || '');
  const [dates, setDates] = useState<string[]>(event?.dates || [today]);

  const addDate = () => setDates([...dates, '']);
  const removeDate = (i: number) => setDates(dates.filter((_, idx) => idx !== i));
  const updateDate = (i: number, v: string) =>
    setDates(dates.map((d, idx) => (idx === i ? v : d)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validDates = dates.filter(Boolean).sort();
    if (!name.trim() || validDates.length === 0) return;
    if (event) {
      updateEvent(event.id, { name, description, dates: validDates });
    } else {
      addEvent({ name, description, dates: validDates });
    }
    onClose();
  };

  return (
    <Modal title={event ? 'イベント編集' : '新規イベント作成'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            イベント名 <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：年次カンファレンス2026"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">概要</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="イベントの説明を入力"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              開催日程 <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addDate}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded"
            >
              <Plus size={13} /> 日程追加
            </button>
          </div>
          <div className="space-y-2">
            {dates.map((date, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => updateDate(i, e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {dates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDate(i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-medium"
          >
            {event ? '更新する' : '作成する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
