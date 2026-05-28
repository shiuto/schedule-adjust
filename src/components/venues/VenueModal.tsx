import { useState } from 'react';
import { Modal } from '../common/Modal';
import { ColorPicker } from '../common/ColorPicker';
import { Venue, Area } from '../../types';
import { useStore } from '../../store/useStore';
import { PRESET_COLORS } from '../../utils/colors';

interface VenueModalProps {
  venue?: Venue;
  onClose: () => void;
}

export function VenueModal({ venue, onClose }: VenueModalProps) {
  const { addVenue, updateVenue } = useStore();
  const [name, setName] = useState(venue?.name || '');
  const [address, setAddress] = useState(venue?.address || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (venue) {
      updateVenue(venue.id, { name, address });
    } else {
      addVenue({ name, address });
    }
    onClose();
  };

  return (
    <Modal title={venue ? '会場を編集' : '会場を追加'} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            会場名 <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：東京国際フォーラム"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="例：東京都千代田区丸の内3-5-1"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700">
            キャンセル
          </button>
          <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-medium">
            {venue ? '更新する' : '追加する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface AreaModalProps {
  venueId: string;
  parentId: string | null;
  depth: number;
  area?: Area;
  onClose: () => void;
}

export function AreaModal({ venueId, parentId, depth, area, onClose }: AreaModalProps) {
  const { addArea, updateArea } = useStore();
  const [name, setName] = useState(area?.name || '');
  const [color, setColor] = useState(area?.color || PRESET_COLORS[depth % PRESET_COLORS.length]);

  const depthLabels = ['エリア', 'ゾーン', 'セクション', 'ブース', 'スペース'];
  const label = depthLabels[Math.min(depth, depthLabels.length - 1)];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (area) {
      updateArea(area.id, { name, color });
    } else {
      addArea({ venueId, parentId, name, color, depth });
    }
    onClose();
  };

  return (
    <Modal title={area ? `${label}を編集` : `${label}を追加`} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}名 <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`例：${['メインホール', 'Aゾーン', '第1セクション', 'VIPブース', '控室'][Math.min(depth, 4)]}`}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">カラー</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700">
            キャンセル
          </button>
          <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-medium">
            {area ? '更新する' : '追加する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
