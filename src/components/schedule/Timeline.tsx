import { useState, useRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { Session } from '../../types';
import { SessionModal } from './SessionModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { contrastColor } from '../../utils/colors';
import { timeToMinutes, minutesToTime } from '../../utils/time';
import { Clock, MapPin, Pencil, Trash2, Plus } from 'lucide-react';

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_WIDTH = 120;
const ROW_HEIGHT = 72;
const HEADER_HEIGHT = 48;
const LABEL_WIDTH = 160;

function timeToX(time: string): number {
  return ((timeToMinutes(time) - START_HOUR * 60) / 60) * HOUR_WIDTH;
}

function xToTime(x: number): string {
  const rawMinutes = (x / HOUR_WIDTH) * 60 + START_HOUR * 60;
  const snapped = Math.round(rawMinutes / 15) * 15;
  const clamped = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60, snapped));
  return minutesToTime(clamped);
}

interface SessionBlockProps {
  session: Session;
  rowIndex: number;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (startTime: string, endTime: string) => void;
}

function SessionBlock({ session, rowIndex, onEdit, onDelete, onUpdate }: SessionBlockProps) {
  const { areas } = useStore();
  const area = session.areaId ? areas.find((a) => a.id === session.areaId) : null;

  const x = timeToX(session.startTime);
  const endX = timeToX(session.endTime);
  const width = Math.max(endX - x, 40);
  const top = HEADER_HEIGHT + rowIndex * ROW_HEIGHT + 6;

  const dragState = useRef<{
    type: 'move' | 'resize';
    startX: number;
    origStart: string;
    origEnd: string;
  } | null>(null);

  const startDrag = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    dragState.current = {
      type,
      startX: e.clientX,
      origStart: session.startTime,
      origEnd: session.endTime,
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - dragState.current.startX;
      const dMin = Math.round((dx / HOUR_WIDTH) * 60 / 15) * 15;
      if (dragState.current.type === 'move') {
        const origStart = timeToMinutes(dragState.current.origStart);
        const origEnd = timeToMinutes(dragState.current.origEnd);
        const dur = origEnd - origStart;
        const newStart = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - dur, origStart + dMin));
        onUpdate(minutesToTime(newStart), minutesToTime(newStart + dur));
      } else {
        const origStart = timeToMinutes(dragState.current.origStart);
        const origEnd = timeToMinutes(dragState.current.origEnd);
        const newEnd = Math.max(origStart + 15, Math.min(END_HOUR * 60, origEnd + dMin));
        onUpdate(dragState.current.origStart, minutesToTime(newEnd));
      }
    };

    const onUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [session, onUpdate]);

  const bg = session.color || '#3b82f6';
  const fg = contrastColor(bg);
  const duration = timeToMinutes(session.endTime) - timeToMinutes(session.startTime);
  const isNarrow = width < 90;

  return (
    <div
      className="absolute rounded-lg shadow-md select-none cursor-move group hover:shadow-lg hover:z-20 transition-shadow"
      style={{
        left: x,
        top,
        width,
        height: ROW_HEIGHT - 12,
        backgroundColor: bg,
        color: fg,
        zIndex: 10,
      }}
      onMouseDown={(e) => startDrag(e, 'move')}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit(); }}
    >
      <div className="flex flex-col h-full px-2 py-1.5 overflow-hidden">
        {isNarrow ? (
          <span className="text-xs font-bold leading-tight truncate" title={session.title}>
            {session.title[0]}
          </span>
        ) : (
          <>
            <span className="text-xs font-bold leading-tight truncate">{session.title}</span>
            <span className="text-xs opacity-80 leading-tight">
              {session.startTime}–{session.endTime}
            </span>
            {area && !isNarrow && (
              <span className="text-xs opacity-60 leading-tight flex items-center gap-0.5 mt-0.5 truncate">
                <MapPin size={8} />{area.name}
              </span>
            )}
          </>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 rounded-r-lg"
        style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
        onMouseDown={(e) => startDrag(e, 'resize')}
      />

      {/* Action buttons - show on hover */}
      {!isNarrow && (
        <div
          className="absolute top-1 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-5 h-5 rounded flex items-center justify-center hover:scale-110 transition-transform"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          >
            <Pencil size={9} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-5 h-5 rounded flex items-center justify-center hover:scale-110 transition-transform"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          >
            <Trash2 size={9} />
          </button>
        </div>
      )}
    </div>
  );
}

interface TimelineProps {
  eventId: string;
  date: string;
  filterPersonIds: string[];
  filterAreaIds: string[];
}

export function Timeline({ eventId, date, filterPersonIds, filterAreaIds }: TimelineProps) {
  const { persons, sessions, areas, updateSession, deleteSession } = useStore();
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [showAdd, setShowAdd] = useState<{ defaultStart: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visiblePersons = filterPersonIds.length > 0
    ? persons.filter((p) => filterPersonIds.includes(p.id))
    : persons;

  const daySessions = sessions.filter(
    (s) =>
      s.eventId === eventId &&
      s.date === date &&
      (filterAreaIds.length === 0 || !s.areaId || filterAreaIds.includes(s.areaId))
  );

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const gridWidth = (END_HOUR - START_HOUR) * HOUR_WIDTH;
  const gridHeight = Math.max(visiblePersons.length * ROW_HEIGHT, 100);

  const handleGridClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedTime = xToTime(x);
    setShowAdd({ defaultStart: clickedTime });
  }, []);

  const handleGridMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoveredTime(xToTime(x));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div
        className="overflow-auto flex-1"
        ref={scrollRef}
        style={{ scrollbarWidth: 'thin' }}
      >
        <div
          className="relative"
          style={{ width: LABEL_WIDTH + gridWidth, minHeight: HEADER_HEIGHT + gridHeight + 32 }}
        >
          {/* Corner */}
          <div
            className="sticky left-0 top-0 z-30 bg-white border-b border-r border-gray-200"
            style={{
              position: 'sticky',
              left: 0,
              top: 0,
              width: LABEL_WIDTH,
              height: HEADER_HEIGHT,
            }}
          >
            {hoveredTime && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-mono text-gray-500">{hoveredTime}</span>
              </div>
            )}
          </div>

          {/* Time header */}
          <div
            className="absolute top-0 bg-white border-b border-gray-200"
            style={{ left: LABEL_WIDTH, height: HEADER_HEIGHT, width: gridWidth, position: 'sticky', top: 0, zIndex: 20 }}
          >
            {hours.map((h) => (
              <div
                key={h}
                className="absolute flex items-center"
                style={{
                  left: (h - START_HOUR) * HOUR_WIDTH,
                  top: 0,
                  height: HEADER_HEIGHT,
                  width: HOUR_WIDTH,
                }}
              >
                <span className="text-xs text-gray-500 font-medium pl-1">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Person labels */}
          <div
            className="absolute top-0 left-0 bg-white border-r border-gray-200"
            style={{ width: LABEL_WIDTH, zIndex: 15, position: 'sticky', left: 0 }}
          >
            {visiblePersons.map((person, i) => (
              <div
                key={person.id}
                className="absolute flex items-center gap-2 px-3 border-b border-gray-100"
                style={{
                  top: HEADER_HEIGHT + i * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                  width: LABEL_WIDTH,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
                  style={{ backgroundColor: person.color, color: contrastColor(person.color) }}
                >
                  {person.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{person.name}</p>
                  {person.role && (
                    <p className="text-xs text-gray-400 truncate">{person.role}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Grid area */}
          <div
            className="absolute cursor-crosshair"
            style={{
              left: LABEL_WIDTH,
              top: HEADER_HEIGHT,
              width: gridWidth,
              height: gridHeight,
            }}
            onClick={handleGridClick}
            onMouseMove={handleGridMouseMove}
            onMouseLeave={() => setHoveredTime(null)}
          >
            {/* Row backgrounds */}
            {visiblePersons.map((_, i) => (
              <div
                key={i}
                className={`absolute w-full border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
                style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
              />
            ))}

            {/* Hour grid lines */}
            {hours.map((h) => (
              <div
                key={h}
                className="absolute top-0 bottom-0 border-l border-gray-200"
                style={{ left: (h - START_HOUR) * HOUR_WIDTH }}
              />
            ))}

            {/* 30-min dashed lines */}
            {hours.map((h) => (
              <div
                key={`${h}-30`}
                className="absolute top-0 bottom-0 border-l border-dashed border-gray-100"
                style={{ left: (h - START_HOUR) * HOUR_WIDTH + HOUR_WIDTH / 2 }}
              />
            ))}

            {/* 15-min subtle lines */}
            {hours.flatMap((h) => [1, 3].map((q) => (
              <div
                key={`${h}-${q}`}
                className="absolute top-0 bottom-0 border-l border-gray-50"
                style={{ left: (h - START_HOUR) * HOUR_WIDTH + (HOUR_WIDTH / 4) * q }}
              />
            )))}

            {/* Session blocks */}
            {daySessions.map((session) => {
              const personIndex = visiblePersons.findIndex((p) =>
                session.personIds.includes(p.id)
              );
              if (personIndex === -1 && visiblePersons.length > 0 && session.personIds.length > 0) return null;
              const rowIdx = personIndex >= 0 ? personIndex : 0;
              return (
                <SessionBlock
                  key={session.id}
                  session={session}
                  rowIndex={rowIdx}
                  onEdit={() => setEditSession(session)}
                  onDelete={() => setDeleteId(session.id)}
                  onUpdate={(s, e) => updateSession(session.id, { startTime: s, endTime: e })}
                />
              );
            })}
          </div>

          {/* Empty state */}
          {visiblePersons.length === 0 && (
            <div
              className="absolute flex flex-col items-center justify-center text-gray-400 pointer-events-none"
              style={{ left: LABEL_WIDTH, top: HEADER_HEIGHT, width: gridWidth, height: 200 }}
            >
              <Clock size={36} className="mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">人物を追加してスケジュールを作成</p>
              <p className="text-xs text-gray-300 mt-1">サイドバーの「人物」タブから追加できます</p>
            </div>
          )}

          {visiblePersons.length > 0 && daySessions.length === 0 && (
            <div
              className="absolute flex flex-col items-center justify-center pointer-events-none"
              style={{ left: LABEL_WIDTH, top: HEADER_HEIGHT + gridHeight / 2 - 30, width: gridWidth }}
            >
              <p className="text-xs text-gray-300">タイムラインをクリックしてセッションを追加</p>
            </div>
          )}
        </div>
      </div>

      {editSession && (
        <SessionModal
          session={editSession}
          eventId={eventId}
          date={date}
          onClose={() => setEditSession(null)}
        />
      )}
      {showAdd && (
        <SessionModal
          eventId={eventId}
          date={date}
          defaultStart={showAdd.defaultStart}
          onClose={() => setShowAdd(null)}
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
