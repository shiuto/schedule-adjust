import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { StakeholderModal } from './StakeholderModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Person } from '../../types';
import { contrastColor } from '../../utils/colors';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

export function StakeholderPanel() {
  const { persons } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { deletePerson } = useStore();

  const groups = [...new Set(persons.map((p) => p.group || ''))];
  const groupedPersons = groups.map((g) => ({
    name: g || '未分類',
    persons: persons.filter((p) => (p.group || '') === g),
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">人物 ({persons.length})</span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg"
        >
          <Plus size={13} /> 追加
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {persons.length === 0 ? (
          <div className="text-center py-8">
            <Users size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">人物を追加してください</p>
          </div>
        ) : (
          groupedPersons.map(({ name, persons: groupPersons }) => (
            <div key={name}>
              <p className="text-xs font-medium text-gray-400 mb-1.5 px-1">{name}</p>
              <div className="space-y-0.5">
                {groupPersons.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 group py-1.5 px-2 rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: p.color, color: contrastColor(p.color) }}
                    >
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      {p.role && (
                        <p className="text-xs text-gray-400 truncate">{p.role}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => setEditPerson(p)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && <StakeholderModal onClose={() => setShowAdd(false)} />}
      {editPerson && <StakeholderModal person={editPerson} onClose={() => setEditPerson(null)} />}
      {deleteId && (
        <ConfirmDialog
          title="人物を削除"
          message="この人物をすべてのスケジュールから削除します。この操作は元に戻せません。"
          danger
          onConfirm={() => { deletePerson(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
