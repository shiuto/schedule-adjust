import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { EventModal } from './EventModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ContextMenu, ContextMenuItem } from '../common/ContextMenu';
import { Event } from '../../types';
import { formatDate } from '../../utils/time';
import { Plus, Calendar, Pencil, Trash2, Upload, Download, CalendarDays, ChevronRight } from 'lucide-react';

export function EventList() {
  const { events, deleteEvent, setCurrentEvent, exportData, importData } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; event: Event } | null>(null);

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (!importData(await file.text())) alert('インポートに失敗しました。');
    };
    input.click();
  };

  const sorted = [...events].sort((a, b) => {
    const aMin = Math.min(...a.dates.map((d) => new Date(d).getTime()));
    const bMin = Math.min(...b.dates.map((d) => new Date(d).getTime()));
    return bMin - aMin;
  });

  const ctxItems = (event: Event): ContextMenuItem[] => [
    { label: '開く', icon: <ChevronRight size={14} />, onClick: () => setCurrentEvent(event.id) },
    { label: '編集', icon: <Pencil size={14} />, onClick: () => setEditEvent(event) },
    { label: '削除', icon: <Trash2 size={14} />, onClick: () => setDeleteId(event.id), danger: true, divider: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <CalendarDays size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">スケジュール管理</h1>
              <p className="text-xs text-gray-400 leading-tight">イベント一覧</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleImport} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              <Upload size={14} /> インポート
            </button>
            <button onClick={handleExport} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              <Download size={14} /> エクスポート
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 rounded-lg font-semibold shadow-sm transition-all"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">新規イベント</span>
              <span className="sm:hidden">追加</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Mobile action row */}
        <div className="flex gap-2 sm:hidden mb-4">
          <button onClick={handleImport} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg">
            <Upload size={14} /> インポート
          </button>
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg">
            <Download size={14} /> エクスポート
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-28">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Calendar size={40} className="text-blue-300" />
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">イベントがありません</p>
            <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto">
              「新規イベント」からイベントを作成してスケジュールを管理しましょう
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 font-semibold shadow-md transition-all hover:shadow-lg"
            >
              最初のイベントを作成する
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                onClick={() => setCurrentEvent(event.id)}
                onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, event }); }}
              >
                {/* Card top accent */}
                <div className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight flex-1 mr-2 text-base">
                      {event.name}
                    </h3>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditEvent(event); }}
                        className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(event.id); }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {event.dates.slice(0, 3).map((d) => (
                      <span key={d} className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2.5 py-1 rounded-full font-medium border border-blue-100">
                        {formatDate(d)}
                      </span>
                    ))}
                    {event.dates.length > 3 && (
                      <span className="text-xs text-gray-400 px-1 py-1">+{event.dates.length - 3}日</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {event.dates.length}日間
                    </span>
                    <div className="flex items-center text-xs text-blue-500 font-semibold gap-1 group-hover:gap-2 transition-all">
                      スケジュールを開く <ChevronRight size={13} />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add card */}
            <button
              onClick={() => setShowCreate(true)}
              className="bg-white/60 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all p-5 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-blue-500 min-h-[160px]"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Plus size={22} />
              </div>
              <span className="text-sm font-medium">新規イベントを作成</span>
            </button>
          </div>
        )}
      </main>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxItems(ctxMenu.event)}
          onClose={() => setCtxMenu(null)}
        />
      )}
      {showCreate && <EventModal onClose={() => setShowCreate(false)} />}
      {editEvent && <EventModal event={editEvent} onClose={() => setEditEvent(null)} />}
      {deleteId && (
        <ConfirmDialog
          title="イベント削除"
          message="このイベントと関連するすべてのスケジュールが完全に削除されます。この操作は元に戻せません。"
          danger
          onConfirm={() => { deleteEvent(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
