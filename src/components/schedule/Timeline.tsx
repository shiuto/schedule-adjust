import { useState, useRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { Session, Person } from '../../types';
import { SessionModal } from './SessionModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ContextMenu, ContextMenuItem } from '../common/ContextMenu';
import { contrastColor } from '../../utils/colors';
import { timeToMinutes, minutesToTime } from '../../utils/time';
import { Clock, MapPin, Pencil, Trash2, Copy, Plus } from 'lucide-react';

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_WIDTH = 120;
const ROW_HEIGHT = 68;
const HEADER_HEIGHT = 44;
const LABEL_WIDTH = 168;
const DRAG_THRESHOLD = 4;

function timeToX(time: string): number {
  return ((timeToMinutes(time) - START_HOUR * 60) / 60) * HOUR_WIDTH;
}

function xToTime(x: number): string {
  const raw = (x / HOUR_WIDTH) * 60 + START_HOUR * 60;
  const snapped = Math.round(raw / 15) * 15;
  const clamped = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - 15, snapped));
  return minutesToTime(clamped);
}

// ─── Session Block ────────────────────────────────────────────────────────────

interface SessionBlockProps {
  session: Session;
  rowIndex: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdate: (startTime: string, endTime: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function SessionBlock({
  session, rowIndex, onEdit, onDelete, onDuplicate, onUpdate, onContextMenu,
}: SessionBlockProps) {
  const { areas } = useStore();
  const area = session.areaId ? areas.find((a) => a.id === session.areaId) : null;
  const moved = useRef(false);
  const downPos = useRef({ x: 0, y: 0 });
  const dragState = useRef<{
    type: 'move' | 'resize';
    origStart: string;
    origEnd: string;
  } | null>(null);

  const x = timeToX(session.startTime);
  const width = Math.max(timeToX(session.endTime) - x, 36);
  const top = rowIndex * ROW_HEIGHT + 5;
  const height = ROW_HEIGHT - 10;
  const isNarrow = width < 80;

  const bg = session.color || '#3b82f6';
  const fg = contrastColor(bg);

  const startDrag = useCallback(
    (e: React.MouseEvent, type: 'move' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
      downPos.current = { x: e.clientX, y: e.clientY };
      dragState.current = { type, origStart: session.startTime, origEnd: session.endTime };

      const onMove = (ev: MouseEvent) => {
        const dx = Math.abs(ev.clientX - downPos.current.x);
        const dy = Math.abs(ev.clientY - downPos.current.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) moved.current = true;
        if (!moved.current || !dragState.current) return;

        const totalDx = ev.clientX - downPos.current.x;
        const dMin = Math.round((totalDx / HOUR_WIDTH) * 60 / 15) * 15;

        if (dragState.current.type === 'move') {
          const origS = timeToMinutes(dragState.current.origStart);
          const origE = timeToMinutes(dragState.current.origEnd);
          const dur = origE - origS;
          const newS = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - dur, origS + dMin));
          onUpdate(minutesToTime(newS), minutesToTime(newS + dur));
        } else {
          const origS = timeToMinutes(dragState.current.origStart);
          const origE = timeToMinutes(dragState.current.origEnd);
          const newE = Math.max(origS + 15, Math.min(END_HOUR * 60, origE + dMin));
          onUpdate(dragState.current.origStart, minutesToTime(newE));
        }
      };

      const onUp = () => {
        dragState.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [session, onUpdate]
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!moved.current) onEdit();
  };

  return (
    <div
      className="absolute group rounded-lg shadow-md select-none hover:shadow-lg hover:z-20 transition-shadow cursor-pointer"
      style={{ left: x, top, width, height, backgroundColor: bg, color: fg, zIndex: 10 }}
      onMouseDown={(e) => startDrag(e, 'move')}
      onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e); }}
      title={`${session.title}\n${session.startTime}–${session.endTime}${area ? `\n📍 ${area.name}` : ''}`}
    >
      <div className="h-full flex flex-col px-2 py-1 overflow-hidden pointer-events-none">
        {isNarrow ? (
          <span className="text-[10px] font-bold truncate leading-tight">{session.title[0]}</span>
        ) : (
          <>
            <span className="text-xs font-bold leading-tight truncate">{session.title}</span>
            <span className="text-[11px] opacity-80 leading-tight">{session.startTime}–{session.endTime}</span>
            {area && (
              <span className="text-[10px] opacity-60 leading-tight flex items-center gap-0.5 mt-0.5 truncate">
                <MapPin size={8} />{area.name}
              </span>
            )}
          </>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-lg opacity-0 group-hover:opacity-100"
        style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
        onMouseDown={(e) => { e.stopPropagation(); startDrag(e, 'resize'); }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

interface TimelineProps {
  eventId: string;
  date: string;
  filterPersonIds: string[];
  filterAreaIds: string[];
}

interface CtxMenuState {
  x: number;
  y: number;
  session: Session;
}

export function Timeline({ eventId, date, filterPersonIds, filterAreaIds }: TimelineProps) {
  const { getEventPersons, sessions, areas, updateSession, deleteSession, duplicateSession } = useStore();
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [addDefault, setAddDefault] = useState<{ time: string; personId?: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);

  const allEventPersons = getEventPersons(eventId);
  const visiblePersons = filterPersonIds.length > 0
    ? allEventPersons.filter((p) => filterPersonIds.includes(p.id))
    : allEventPersons;

  const daySessions = sessions.filter(
    (s) =>
      s.eventId === eventId &&
      s.date === date &&
      (filterAreaIds.length === 0 || !s.areaId || filterAreaIds.includes(s.areaId))
  );

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const gridWidth = (END_HOUR - START_HOUR) * HOUR_WIDTH;
  const nRows = Math.max(visiblePersons.length, 1);
  const gridHeight = nRows * ROW_HEIGHT;
  const totalWidth = LABEL_WIDTH + gridWidth;
  const totalHeight = HEADER_HEIGHT + gridHeight;

  // Current time indicator
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const showNow = nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;
  const nowX = LABEL_WIDTH + ((nowMin - START_HOUR * 60) / 60) * HOUR_WIDTH;

  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, personId?: string) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setAddDefault({ time: xToTime(x), personId });
    },
    []
  );

  const ctxItems = (session: Session): ContextMenuItem[] => [
    {
      label: '編集',
      icon: <Pencil size={14} />,
      onClick: () => setEditSession(session),
    },
    {
      label: '複製',
      icon: <Copy size={14} />,
      onClick: () => duplicateSession(session.id),
    },
    {
      label: '削除',
      icon: <Trash2 size={14} />,
      onClick: () => setDeleteId(session.id),
      danger: true,
      divider: true,
    },
  ];

  // Build a map: personId → sorted sessions
  const sessionsByPerson = new Map<string, Session[]>();
  daySessions.forEach((sess) => {
    sess.personIds.forEach((pid) => {
      if (!sessionsByPerson.has(pid)) sessionsByPerson.set(pid, []);
      sessionsByPerson.get(pid)!.push(sess);
    });
  });

  // Unassigned sessions (no person or person not in visiblePersons)
  const unassignedSessions = daySessions.filter(
    (s) =>
      s.personIds.length === 0 ||
      !s.personIds.some((pid) => visiblePersons.find((p) => p.id === pid))
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="overflow-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
        <div style={{ position: 'relative', width: totalWidth, height: totalHeight, minHeight: '100%' }}>

          {/* ── Sticky header row ── */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 25,
              display: 'flex',
              height: HEADER_HEIGHT,
              backgroundColor: '#fff',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            {/* Corner */}
            <div
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 35,
                width: LABEL_WIDTH,
                flexShrink: 0,
                backgroundColor: '#fff',
                borderRight: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="text-xs text-gray-400 font-medium">
                {visiblePersons.length > 0 ? `${visiblePersons.length}名` : ''}
              </span>
            </div>
            {/* Time labels */}
            <div style={{ position: 'relative', width: gridWidth, flexShrink: 0 }}>
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute flex items-center"
                  style={{ left: (h - START_HOUR) * HOUR_WIDTH, top: 0, height: HEADER_HEIGHT, paddingLeft: 6 }}
                >
                  <span className="text-xs text-gray-500 font-medium tabular-nums">
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Person rows ── */}
          {visiblePersons.map((person, rowIdx) => {
            const rowTop = HEADER_HEIGHT + rowIdx * ROW_HEIGHT;
            return (
              <div
                key={person.id}
                style={{ position: 'absolute', top: rowTop, left: 0, width: totalWidth, height: ROW_HEIGHT }}
              >
                {/* Label – sticky left */}
                <div
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 12,
                    width: LABEL_WIDTH,
                    height: ROW_HEIGHT,
                    backgroundColor: rowIdx % 2 === 0 ? '#fff' : '#f9fafb',
                    borderRight: '1px solid #e5e7eb',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    paddingLeft: 10,
                    paddingRight: 8,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: person.color, color: contrastColor(person.color) }}
                  >
                    {person.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{person.name}</p>
                    {person.role && (
                      <p className="text-[10px] text-gray-400 truncate leading-tight">{person.role}</p>
                    )}
                  </div>
                </div>

                {/* Clickable grid cell */}
                <div
                  className="absolute cursor-crosshair"
                  style={{
                    left: LABEL_WIDTH,
                    top: 0,
                    width: gridWidth,
                    height: ROW_HEIGHT,
                    backgroundColor: rowIdx % 2 === 0 ? '#fff' : '#f9fafb',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                  onClick={(e) => handleGridClick(e, person.id)}
                >
                  {/* Hour lines */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 border-l border-gray-100"
                      style={{ left: (h - START_HOUR) * HOUR_WIDTH }}
                    />
                  ))}
                  {/* 30-min dashed */}
                  {hours.map((h) => (
                    <div
                      key={`${h}-30`}
                      className="absolute top-0 bottom-0 border-l border-dashed border-gray-100"
                      style={{ left: (h - START_HOUR) * HOUR_WIDTH + HOUR_WIDTH / 2 }}
                    />
                  ))}
                  {/* Add hint on empty row hover */}
                  <div className="absolute inset-0 flex items-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex items-center gap-1 text-gray-200 text-xs ml-2">
                      <Plus size={10} /> クリックして追加
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── Session blocks layer ── */}
          <div
            style={{
              position: 'absolute',
              left: LABEL_WIDTH,
              top: HEADER_HEIGHT,
              width: gridWidth,
              height: gridHeight,
              pointerEvents: 'none',
            }}
          >
            {visiblePersons.map((person, rowIdx) => {
              const personSessions = sessionsByPerson.get(person.id) || [];
              return personSessions.map((session) => (
                <div
                  key={`${session.id}-${person.id}`}
                  style={{
                    position: 'absolute',
                    top: rowIdx * ROW_HEIGHT,
                    left: 0,
                    width: gridWidth,
                    height: ROW_HEIGHT,
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ pointerEvents: 'auto' }}>
                    <SessionBlock
                      session={session}
                      rowIndex={0}
                      onEdit={() => setEditSession(session)}
                      onDelete={() => setDeleteId(session.id)}
                      onDuplicate={() => duplicateSession(session.id)}
                      onUpdate={(s, e) => updateSession(session.id, { startTime: s, endTime: e })}
                      onContextMenu={(e) => setCtxMenu({ x: e.clientX, y: e.clientY, session })}
                    />
                  </div>
                </div>
              ));
            })}
          </div>

          {/* Current time line */}
          {showNow && (
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{ left: nowX, width: 1.5, backgroundColor: '#ef4444' }}
            >
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-red-500"
                style={{ top: HEADER_HEIGHT - 5, left: -4.5 }}
              />
            </div>
          )}

          {/* Empty state */}
          {visiblePersons.length === 0 && (
            <div
              className="absolute flex flex-col items-center justify-center text-gray-400 pointer-events-none"
              style={{ left: LABEL_WIDTH, top: HEADER_HEIGHT, width: gridWidth, height: 220 }}
            >
              <Clock size={40} className="mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">人物をサイドバーから追加してください</p>
              <p className="text-xs text-gray-300 mt-1">「人物」タブで追加・イベントへの参加設定ができます</p>
            </div>
          )}

          {/* Unassigned sessions notice */}
          {unassignedSessions.length > 0 && visiblePersons.length > 0 && (
            <div
              className="absolute pointer-events-none"
              style={{ left: LABEL_WIDTH + 8, top: HEADER_HEIGHT + 4, zIndex: 5 }}
            >
              <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                未割当セッション {unassignedSessions.length}件（リスト表示で確認）
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxItems(ctxMenu.session)}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {editSession && (
        <SessionModal
          session={editSession}
          eventId={eventId}
          date={date}
          onClose={() => setEditSession(null)}
        />
      )}
      {addDefault && (
        <SessionModal
          eventId={eventId}
          date={date}
          defaultStart={addDefault.time}
          defaultPersonId={addDefault.personId}
          onClose={() => setAddDefault(null)}
        />
      )}
      {deleteId && (
        <ConfirmDialog
          title="セッションを削除"
          message="このセッションを削除しますか？"
          danger
          onConfirm={() => { deleteSession(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
