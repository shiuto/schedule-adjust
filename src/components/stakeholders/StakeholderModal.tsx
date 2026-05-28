import { useState } from 'react';
import { Modal } from '../common/Modal';
import { ColorPicker } from '../common/ColorPicker';
import { Person } from '../../types';
import { useStore } from '../../store/useStore';
import { PRESET_COLORS } from '../../utils/colors';

interface StakeholderModalProps {
  person?: Person;
  onClose: () => void;
}

export function StakeholderModal({ person, onClose }: StakeholderModalProps) {
  const { addPerson, updatePerson, persons } = useStore();
  const usedColors = persons.filter((p) => p.id !== person?.id).map((p) => p.color);
  const defaultColor = PRESET_COLORS.find((c) => !usedColors.includes(c)) || PRESET_COLORS[0];

  const [name, setName] = useState(person?.name || '');
  const [role, setRole] = useState(person?.role || '');
  const [group, setGroup] = useState(person?.group || '');
  const [color, setColor] = useState(person?.color || defaultColor);

  const existingGroups = [...new Set(persons.map((p) => p.group).filter(Boolean))];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (person) {
      updatePerson(person.id, { name, role, group, color });
    } else {
      addPerson({ name, role, group, color });
    }
    onClose();
  };

  return (
    <Modal title={person ? '人物を編集' : '人物を追加'} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：山田 太郎"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">役職</label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="例：CEO、司会、スタッフ"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">グループ</label>
          <input
            list="group-suggestions"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="例：経営陣、運営スタッフ"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {existingGroups.length > 0 && (
            <datalist id="group-suggestions">
              {existingGroups.map((g) => <option key={g} value={g} />)}
            </datalist>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">カラー</label>
          <ColorPicker value={color} onChange={setColor} />
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
            {person ? '更新する' : '追加する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
