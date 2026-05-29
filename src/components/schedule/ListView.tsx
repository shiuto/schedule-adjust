import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Session } from '../../types';
import { SessionModal } from './SessionModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ContextMenu, ContextMenuItem } from '../common/ContextMenu';
import { contrastColor } from '../../utils/colors';
import { Clock, MapPin, Pencil, Trash2, Plus, Users, Copy } from 'lucide-react';

interface ListViewProps {
  eventId: string;
  date: string;
}

export function ListView({ eventId, date }: ListViewProps) {
  const { sessions, persons, areas, deleteSession, duplicateSession } = useStore();
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; session: Session } | null>(null);

  const daySessions = sessions
    .filter((s) => s.eventId === eventId && s.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const ctxItems = (session: Session): ContextMenuItem[] => [
    { label: '編集', icon: <Pencil size={14} />, onClick: () => setEditSession(session) },
    { label: '複製', icon: <Copy size={14} />, onClick: () => duplicateSession(session.id) },
    { label: '削除', icon: <Trash2 size={14} />, onClick: () => setDeleteId(session.id), danger: true, divider: true },
  ];

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium shadow-sm"
        >
          <Plus size={15} /> セッション追加
        </button>
      </div>

      {daySessions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Clock size={44} className="mx-auto mb-4 text-gray-200" />
          <p className="font-medium text-gray-500">スケジュールがありません</p>
          <p className="text-sm mt-1 text-gray-400">「セッション追加」からスケジュールを作成してください</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {daySessions.map((session) => {
            const sessionPersons = persons.filter((p) => session.personIds.includes(p.id));
            const area = session.areaId ? areas.find((a) => a.id === session.areaId) : null;
            const bg = session.color || '#3b82f6';

            return (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setEditSession(session)}
                onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, session }); }}
              >
                <div className="flex">
                  <div className="w-1.5 shrink-0" style={{ backgroundColor: bg }} />
                  <div className="flex-1 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm">{session.title}</h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium tabular-nums"
                            style={{ backgroundColor: bg, color: contrastColor(bg) }}
                          >
                            {session.startTime}–{session.endTime}
                          </span>
                          {area && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color }} />
                              {area.name}
                            </span>
                          )}
                        </div>
                        {session.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{session.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => duplicateSession(session.id)} className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg">
                          <Copy size={13} />
                        </button>
                        <button onClick={() => setDeleteId(session.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {sessionPersons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 items-center">
                        <Users size={11} className="text-gray-300" />
                        {sessionPersons.map((p) => (
                          <span
                            key={p.id}
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: p.color, color: contrastColor(p.color) }}
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxItems(ctxMenu.session)}
          onClose={() => setCtxMenu(null)}
        />
      )}
      {editSession && <SessionModal session={editSession} eventId={eventId} date={date} onClose={() => setEditSession(null)} />}
      {showAdd && <SessionModal eventId={eventId} date={date} onClose={() => setShowAdd(false)} />}
      {deleteId && (
        <ConfirmDialog title="セッションを削除" message="このセッションを削除しますか？" danger
          onConfirm={() => { deleteSession(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
