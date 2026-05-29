import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { StakeholderModal } from './StakeholderModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ContextMenu, ContextMenuItem } from '../common/ContextMenu';
import { Person } from '../../types';
import { contrastColor } from '../../utils/colors';
import { Plus, Pencil, Trash2, Copy, Users, ToggleLeft, ToggleRight } from 'lucide-react';

interface StakeholderPanelProps {
  eventId: string;
}

export function StakeholderPanel({ eventId }: StakeholderPanelProps) {
  const { persons, deletePerson, duplicatePerson, events, toggleEventPerson } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; person: Person } | null>(null);

  const event = events.find((e) => e.id === eventId);
  const isActive = (personId: string) =>
    !event || event.eventPersonIds.length === 0 || event.eventPersonIds.includes(personId);

  const activeCount = event
    ? event.eventPersonIds.length === 0
      ? persons.length
      : event.eventPersonIds.length
    : persons.length;

  const groups = [...new Set(persons.map((p) => p.group || ''))];

  const personCtxItems = (p: Person): ContextMenuItem[] => [
    { label: '編集', icon: <Pencil size={14} />, onClick: () => setEditPerson(p) },
    { label: '複製', icon: <Copy size={14} />, onClick: () => duplicatePerson(p.id) },
    {
      label: isActive(p.id) ? 'このイベントから外す' : 'このイベントに追加',
      icon: isActive(p.id) ? <ToggleRight size={14} /> : <ToggleLeft size={14} />,
      onClick: () => toggleEventPerson(eventId, p.id),
      divider: true,
    },
    { label: '削除（全体から）', icon: <Trash2 size={14} />, onClick: () => setDeleteId(p.id), danger: true, divider: true },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">人物</span>
          <span className="text-xs text-gray-400">
            {activeCount}/{persons.length}名参加
          </span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg font-medium"
        >
          <Plus size={13} /> 追加
        </button>
      </div>

      {/* イベント参加切替の説明 */}
      {persons.length > 0 && (
        <p className="text-[10px] text-gray-400 mb-2 px-1">
          ● = このイベントに参加中　右クリックでメニュー
        </p>
      )}

      {/* Person list */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {persons.length === 0 ? (
          <div className="text-center py-8">
            <Users size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">人物を追加してください</p>
          </div>
        ) : (
          groups.map((group) => {
            const groupPersons = persons.filter((p) => (p.group || '') === group);
            return (
              <div key={group}>
                {group && (
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1">
                    {group}
                  </p>
                )}
                <div className="space-y-0.5">
                  {groupPersons.map((p) => {
                    const active = isActive(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg group transition-colors cursor-pointer ${
                          active ? 'hover:bg-gray-50' : 'opacity-50 hover:bg-gray-50'
                        }`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setCtxMenu({ x: e.clientX, y: e.clientY, person: p });
                        }}
                        onClick={() => toggleEventPerson(eventId, p.id)}
                      >
                        {/* Active indicator */}
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                            active ? 'opacity-100' : 'opacity-30'
                          }`}
                          style={{ backgroundColor: p.color }}
                        />
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                            active ? 'shadow-sm' : ''
                          }`}
                          style={{
                            backgroundColor: active ? p.color : '#e5e7eb',
                            color: active ? contrastColor(p.color) : '#9ca3af',
                          }}
                        >
                          {p.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${active ? 'text-gray-800' : 'text-gray-400'}`}>
                            {p.name}
                          </p>
                          {p.role && (
                            <p className="text-[10px] text-gray-400 truncate">{p.role}</p>
                          )}
                        </div>
                        {/* Quick actions */}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditPerson(p); }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                            title="編集"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); duplicatePerson(p.id); }}
                            className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg"
                            title="複製"
                          >
                            <Copy size={11} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            title="削除"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={personCtxItems(ctxMenu.person)}
          onClose={() => setCtxMenu(null)}
        />
      )}

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
