import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { VenueModal, AreaModal } from './VenueModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ContextMenu, ContextMenuItem } from '../common/ContextMenu';
import { Area, Venue } from '../../types';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, MapPin, Building2, Copy } from 'lucide-react';

const MAX_DEPTH = 4;

interface AreaNodeProps {
  area: Area;
  allAreas: Area[];
  depth: number;
}

function AreaNode({ area, allAreas, depth }: AreaNodeProps) {
  const { deleteArea, duplicateArea } = useStore();
  const [expanded, setExpanded] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const children = allAreas.filter((a) => a.parentId === area.id);

  const ctxItems: ContextMenuItem[] = [
    { label: '編集', icon: <Pencil size={14} />, onClick: () => setShowEdit(true) },
    { label: '複製', icon: <Copy size={14} />, onClick: () => duplicateArea(area.id) },
    ...(depth < MAX_DEPTH ? [{ label: '子エリア追加', icon: <Plus size={14} />, onClick: () => setShowAddChild(true) }] : []),
    { label: '削除', icon: <Trash2 size={14} />, onClick: () => setShowDelete(true), danger: true, divider: true },
  ];

  return (
    <div>
      <div
        className="flex items-center gap-1 group py-1 rounded-lg hover:bg-gray-50 cursor-pointer"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-0.5 text-gray-400 shrink-0 ${children.length === 0 ? 'invisible' : ''}`}
        >
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>
        <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: area.color }} />
        <span className="text-xs text-gray-700 flex-1 truncate">{area.name}</span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pr-1">
          {depth < MAX_DEPTH && (
            <button onClick={() => setShowAddChild(true)} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="子エリア追加">
              <Plus size={11} />
            </button>
          )}
          <button onClick={() => setShowEdit(true)} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded">
            <Pencil size={11} />
          </button>
          <button onClick={() => duplicateArea(area.id)} className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded" title="複製">
            <Copy size={11} />
          </button>
          <button onClick={() => setShowDelete(true)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {expanded && children.map((child) => (
        <AreaNode key={child.id} area={child} allAreas={allAreas} depth={depth + 1} />
      ))}

      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems} onClose={() => setCtxMenu(null)} />
      )}
      {showAddChild && (
        <AreaModal venueId={area.venueId} parentId={area.id} depth={depth + 1} onClose={() => setShowAddChild(false)} />
      )}
      {showEdit && (
        <AreaModal venueId={area.venueId} parentId={area.parentId} depth={area.depth} area={area} onClose={() => setShowEdit(false)} />
      )}
      {showDelete && (
        <ConfirmDialog
          title="エリアを削除"
          message="このエリアと配下のすべての子エリアを削除します。"
          danger
          onConfirm={() => { deleteArea(area.id); setShowDelete(false); }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

interface VenueRowProps {
  venue: Venue;
  eventId: string;
}

function VenueRow({ venue, eventId }: VenueRowProps) {
  const { areas, deleteVenue, events, toggleEventVenue } = useStore();
  const [expanded, setExpanded] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const event = events.find((e) => e.id === eventId);
  const isActive =
    !event || event.eventVenueIds.length === 0 || event.eventVenueIds.includes(venue.id);

  const venueAreas = areas.filter((a) => a.venueId === venue.id);
  const topAreas = venueAreas.filter((a) => a.parentId === null);

  const ctxItems: ContextMenuItem[] = [
    { label: '編集', icon: <Pencil size={14} />, onClick: () => setShowEdit(true) },
    { label: 'エリア追加', icon: <Plus size={14} />, onClick: () => setShowAddArea(true) },
    {
      label: isActive ? 'このイベントから外す' : 'このイベントに追加',
      icon: <MapPin size={14} />,
      onClick: () => toggleEventVenue(eventId, venue.id),
      divider: true,
    },
    { label: '削除', icon: <Trash2 size={14} />, onClick: () => setShowDelete(true), danger: true, divider: true },
  ];

  return (
    <div className={`border rounded-xl overflow-hidden mb-2 transition-opacity ${isActive ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
      <div
        className="flex items-center gap-2 px-2 py-2.5 bg-gray-50 group cursor-pointer"
        onClick={() => toggleEventVenue(eventId, venue.id)}
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="text-gray-400 p-0.5 shrink-0"
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        {/* Active indicator */}
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}
        />
        <Building2 size={13} className="text-gray-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-700 block truncate">{venue.name}</span>
          {venue.address && <span className="text-xs text-gray-400 truncate block">{venue.address}</span>}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setShowAddArea(true)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="エリア追加">
            <Plus size={12} />
          </button>
          <button onClick={() => setShowEdit(true)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
            <Pencil size={12} />
          </button>
          <button onClick={() => setShowDelete(true)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="py-1 bg-white">
          {topAreas.length === 0 ? (
            <button onClick={() => setShowAddArea(true)} className="w-full text-xs text-gray-400 hover:text-blue-500 py-2 px-4 text-left hover:bg-blue-50 transition-colors">
              + エリアを追加
            </button>
          ) : (
            topAreas.map((area) => (
              <AreaNode key={area.id} area={area} allAreas={venueAreas} depth={0} />
            ))
          )}
        </div>
      )}

      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems} onClose={() => setCtxMenu(null)} />
      )}
      {showEdit && <VenueModal venue={venue} onClose={() => setShowEdit(false)} />}
      {showDelete && (
        <ConfirmDialog title="会場を削除" message="この会場と配下のすべてのエリアを削除します。" danger
          onConfirm={() => { deleteVenue(venue.id); setShowDelete(false); }}
          onCancel={() => setShowDelete(false)}
        />
      )}
      {showAddArea && (
        <AreaModal venueId={venue.id} parentId={null} depth={0} onClose={() => setShowAddArea(false)} />
      )}
    </div>
  );
}

interface VenuePanelProps {
  eventId: string;
}

export function VenuePanel({ eventId }: VenuePanelProps) {
  const { venues, events } = useStore();
  const [showAdd, setShowAdd] = useState(false);

  const event = events.find((e) => e.id === eventId);
  const activeCount = event
    ? event.eventVenueIds.length === 0 ? venues.length : event.eventVenueIds.length
    : venues.length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">会場・エリア</span>
          <span className="text-xs text-gray-400">{activeCount}/{venues.length}</span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg font-medium"
        >
          <Plus size={13} /> 会場追加
        </button>
      </div>

      {venues.length > 0 && (
        <p className="text-[10px] text-gray-400 mb-2 px-1">
          ● = このイベントで使用中　クリックで切替
        </p>
      )}

      <div className="flex-1 overflow-y-auto">
        {venues.length === 0 ? (
          <div className="text-center py-8">
            <Building2 size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">会場を追加してください</p>
          </div>
        ) : (
          venues.map((venue) => (
            <VenueRow key={venue.id} venue={venue} eventId={eventId} />
          ))
        )}
      </div>

      {showAdd && <VenueModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
