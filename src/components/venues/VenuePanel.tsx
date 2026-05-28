import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { VenueModal, AreaModal } from './VenueModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Area, Venue } from '../../types';
import {
  Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  MapPin, Building2,
} from 'lucide-react';

const MAX_DEPTH = 4;

interface AreaNodeProps {
  area: Area;
  allAreas: Area[];
  depth: number;
}

function AreaNode({ area, allAreas, depth }: AreaNodeProps) {
  const { deleteArea } = useStore();
  const [expanded, setExpanded] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const children = allAreas.filter((a) => a.parentId === area.id);

  return (
    <div>
      <div
        className="flex items-center gap-1 group py-1 rounded-lg hover:bg-gray-50"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-0.5 text-gray-400 shrink-0 ${children.length === 0 ? 'invisible' : ''}`}
        >
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: area.color }}
        />
        <span className="text-xs text-gray-700 flex-1 truncate">{area.name}</span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pr-1">
          {depth < MAX_DEPTH && (
            <button
              onClick={() => setShowAddChild(true)}
              className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
              title="子エリア追加"
            >
              <Plus size={11} />
            </button>
          )}
          <button
            onClick={() => setShowEdit(true)}
            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {expanded && children.map((child) => (
        <AreaNode key={child.id} area={child} allAreas={allAreas} depth={depth + 1} />
      ))}

      {showAddChild && (
        <AreaModal
          venueId={area.venueId}
          parentId={area.id}
          depth={depth + 1}
          onClose={() => setShowAddChild(false)}
        />
      )}
      {showEdit && (
        <AreaModal
          venueId={area.venueId}
          parentId={area.parentId}
          depth={area.depth}
          area={area}
          onClose={() => setShowEdit(false)}
        />
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
}

function VenueRow({ venue }: VenueRowProps) {
  const { areas, deleteVenue } = useStore();
  const [expanded, setExpanded] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);

  const venueAreas = areas.filter((a) => a.venueId === venue.id);
  const topAreas = venueAreas.filter((a) => a.parentId === null);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden mb-2">
      <div className="flex items-center gap-2 px-2 py-2.5 bg-gray-50 group">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 p-0.5 shrink-0">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <Building2 size={13} className="text-gray-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-700 block truncate">{venue.name}</span>
          {venue.address && (
            <span className="text-xs text-gray-400 truncate block">{venue.address}</span>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setShowAddArea(true)}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
            title="エリア追加"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="py-1 bg-white">
          {topAreas.length === 0 ? (
            <button
              onClick={() => setShowAddArea(true)}
              className="w-full text-xs text-gray-400 hover:text-blue-500 py-2 px-4 text-left hover:bg-blue-50 transition-colors"
            >
              + エリアを追加
            </button>
          ) : (
            topAreas.map((area) => (
              <AreaNode key={area.id} area={area} allAreas={venueAreas} depth={0} />
            ))
          )}
        </div>
      )}

      {showEdit && <VenueModal venue={venue} onClose={() => setShowEdit(false)} />}
      {showDelete && (
        <ConfirmDialog
          title="会場を削除"
          message="この会場と配下のすべてのエリアを削除します。"
          danger
          onConfirm={() => { deleteVenue(venue.id); setShowDelete(false); }}
          onCancel={() => setShowDelete(false)}
        />
      )}
      {showAddArea && (
        <AreaModal
          venueId={venue.id}
          parentId={null}
          depth={0}
          onClose={() => setShowAddArea(false)}
        />
      )}
    </div>
  );
}

export function VenuePanel() {
  const { venues } = useStore();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">会場・エリア ({venues.length})</span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg"
        >
          <Plus size={13} /> 会場追加
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {venues.length === 0 ? (
          <div className="text-center py-8">
            <Building2 size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">会場を追加してください</p>
          </div>
        ) : (
          venues.map((venue) => <VenueRow key={venue.id} venue={venue} />)
        )}
      </div>

      {showAdd && <VenueModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
