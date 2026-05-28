import { useState } from 'react';
import { Modal } from '../common/Modal';
import { ColorPicker } from '../common/ColorPicker';
import { Session } from '../../types';
import { useStore } from '../../store/useStore';
import { PRESET_COLORS, contrastColor } from '../../utils/colors';
import { timeToMinutes } from '../../utils/time';
import { AlertTriangle } from 'lucide-react';

interface SessionModalProps {
  session?: Session;
  eventId: string;
  date: string;
  defaultStart?: string;
  onClose: () => void;
}

export function SessionModal({ session, eventId, date, defaultStart = '09:00', onClose }: SessionModalProps) {
  const { addSession, updateSession, sessions, persons, venues, areas } = useStore();
  const [title, setTitle] = useState(session?.title || '');
  const [description, setDescription] = useState(session?.description || '');
  const [startTime, setStartTime] = useState(session?.startTime || defaultStart);
  const [endTime, setEndTime] = useState(session?.endTime || (() => {
    const [h, m] = defaultStart.split(':').map(Number);
    const total = h * 60 + m + 60;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  })());
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(session?.personIds || []);
  const [areaId, setAreaId] = useState<string | null>(session?.areaId ?? null);
  const [color, setColor] = useState(session?.color || PRESET_COLORS[0]);

  const otherSessions = sessions.filter(
    (s) => s.id !== session?.id && s.eventId === eventId && s.date === date
  );

  const conflicts = selectedPersonIds.flatMap((pid) => {
    const sStart = timeToMinutes(startTime);
    const sEnd = timeToMinutes(endTime);
    return otherSessions
      .filter((s) => {
        if (!s.personIds.includes(pid)) return false;
        const oStart = timeToMinutes(s.startTime);
        const oEnd = timeToMinutes(s.endTime);
        return sStart < oEnd && sEnd > oStart;
      })
      .map((s) => ({
        person: persons.find((p) => p.id === pid)?.name || '?',
        session: s.title,
      }));
  });

  const togglePerson = (id: string) =>
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const getFlatAreas = (venueId: string) => {
    const venueAreas = areas.filter((a) => a.venueId === venueId);
    const flatten = (parentId: string | null, depth: number): Array<{ id: string; name: string; depth: number }> => {
      return venueAreas
        .filter((a) => a.parentId === parentId)
        .flatMap((a) => [{ id: a.id, name: a.name, depth }, ...flatten(a.id, depth + 1)]);
    };
    return flatten(null, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data = {
      eventId, date, title, description,
      startTime, endTime,
      personIds: selectedPersonIds,
      areaId,
      color,
    };
    if (session) {
      updateSession(session.id, data);
    } else {
      addSession(data);
    }
    onClose();
  };

  return (
    <Modal title={session ? 'セッションを編集' : 'セッションを追加'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：開会式、VIPランチ、記者会見"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="補足情報を入力"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">開始時刻</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">終了時刻</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {conflicts.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-semibold text-sm mb-1">ダブルブッキング検出</p>
              {[...new Map(conflicts.map((c) => [`${c.person}-${c.session}`, c])).values()].map((c, i) => (
                <p key={i} className="text-xs">
                  <span className="font-medium">{c.person}</span> が「{c.session}」と時間が重複しています
                </p>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">参加者</label>
          {persons.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">人物をサイドバーから先に追加してください</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {persons.map((p) => {
                const selected = selectedPersonIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePerson(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                      selected
                        ? 'border-transparent shadow-sm scale-105'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                    style={selected ? { backgroundColor: p.color, color: contrastColor(p.color) } : {}}
                  >
                    <span>{p.name}</span>
                    {p.role && <span className="opacity-60">·{p.role}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">エリア</label>
          {venues.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">会場をサイドバーから先に追加してください</p>
          ) : (
            <select
              value={areaId || ''}
              onChange={(e) => setAreaId(e.target.value || null)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">エリア未指定</option>
              {venues.map((v) => {
                const flat = getFlatAreas(v.id);
                if (flat.length === 0) return null;
                return (
                  <optgroup key={v.id} label={`🏢 ${v.name}`}>
                    {flat.map((a) => (
                      <option key={a.id} value={a.id}>
                        {'　'.repeat(a.depth)}{a.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
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
            {session ? '更新する' : '追加する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
