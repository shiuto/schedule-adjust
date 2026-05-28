import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Timeline } from '../components/schedule/Timeline';
import { ListView } from '../components/schedule/ListView';
import { StakeholderPanel } from '../components/stakeholders/StakeholderPanel';
import { VenuePanel } from '../components/venues/VenuePanel';
import { SessionModal } from '../components/schedule/SessionModal';
import { formatDate } from '../utils/time';
import {
  ArrowLeft, CalendarDays, Users, MapPin,
  List, Plus, Filter, X, Menu, AlignLeft, AlertCircle,
} from 'lucide-react';

type SidebarTab = 'persons' | 'venues';
type ViewMode = 'timeline' | 'list';

export function EventDetailPage() {
  const {
    events, currentEventId, currentDate,
    setCurrentEvent, setCurrentDate,
    persons, areas,
  } = useStore();

  const event = events.find((e) => e.id === currentEventId);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('persons');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [filterPersonIds, setFilterPersonIds] = useState<string[]>([]);
  const [filterAreaIds, setFilterAreaIds] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!event) return null;
  const activeDate = currentDate || event.dates[0];

  const togglePersonFilter = (id: string) =>
    setFilterPersonIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  const toggleAreaFilter = (id: string) =>
    setFilterAreaIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  const clearFilters = () => { setFilterPersonIds([]); setFilterAreaIds([]); };
  const activeFilterCount = filterPersonIds.length + filterAreaIds.length;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            onClick={() => setCurrentEvent(null)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1.5 rounded-lg"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline text-sm">一覧</span>
          </button>

          <div className="h-4 w-px bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CalendarDays size={16} className="text-blue-500 shrink-0" />
            <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate">{event.name}</h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Date tabs - scrollable on mobile */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
              {event.dates.map((d) => (
                <button
                  key={d}
                  onClick={() => setCurrentDate(d)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
                    activeDate === d
                      ? 'bg-white shadow text-blue-600 font-semibold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {formatDate(d)}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'timeline' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="タイムライン"
              >
                <AlignLeft size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="リスト"
              >
                <List size={15} />
              </button>
            </div>

            {/* Filter */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
              }`}
            >
              <Filter size={13} />
              {activeFilterCount > 0 ? `フィルタ(${activeFilterCount})` : 'フィルタ'}
            </button>

            {/* Add session */}
            <button
              onClick={() => setShowAddSession(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">セッション追加</span>
            </button>

            {/* Mobile: sidebar toggle */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg sm:hidden"
            >
              <Users size={17} />
            </button>

            {/* Desktop: sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden sm:flex p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={17} />
            </button>
          </div>
        </div>

        {/* Mobile view/filter bar */}
        <div className="flex items-center gap-2 px-3 pb-2 sm:hidden border-t pt-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-md ${viewMode === 'timeline' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
            >
              <List size={14} />
            </button>
          </div>
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border ${
              activeFilterCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            <Filter size={12} />
            {activeFilterCount > 0 ? `フィルタ(${activeFilterCount})` : 'フィルタ'}
          </button>
        </div>

        {/* Filter panel */}
        {showFilterPanel && (
          <div className="border-t bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">フィルタ設定</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                >
                  <X size={11} /> すべてクリア
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">人物で絞り込み</p>
                <div className="flex flex-wrap gap-1.5">
                  {persons.length === 0 ? (
                    <p className="text-xs text-gray-400">人物がいません</p>
                  ) : persons.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => togglePersonFilter(p.id)}
                      className={`px-2.5 py-1 text-xs rounded-full border-2 transition-all font-medium ${
                        filterPersonIds.includes(p.id)
                          ? 'border-transparent text-white shadow-sm'
                          : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'
                      }`}
                      style={filterPersonIds.includes(p.id) ? { backgroundColor: p.color } : {}}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">エリアで絞り込み</p>
                <div className="flex flex-wrap gap-1.5">
                  {areas.length === 0 ? (
                    <p className="text-xs text-gray-400">エリアがありません</p>
                  ) : areas.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => toggleAreaFilter(a.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border-2 transition-all ${
                        filterAreaIds.includes(a.id)
                          ? 'border-transparent text-white shadow-sm'
                          : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'
                      }`}
                      style={filterAreaIds.includes(a.id) ? { backgroundColor: a.color } : {}}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: filterAreaIds.includes(a.id) ? 'white' : a.color }}
                      />
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {viewMode === 'timeline' ? (
            <Timeline
              eventId={event.id}
              date={activeDate}
              filterPersonIds={filterPersonIds}
              filterAreaIds={filterAreaIds}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <ListView eventId={event.id} date={activeDate} />
            </div>
          )}
        </main>

        {/* Desktop sidebar */}
        {sidebarOpen && (
          <aside className="hidden sm:flex w-72 bg-white border-l flex-col shrink-0">
            <div className="flex border-b">
              <button
                onClick={() => setSidebarTab('persons')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                  sidebarTab === 'persons'
                    ? 'text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users size={14} /> 人物
              </button>
              <button
                onClick={() => setSidebarTab('venues')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                  sidebarTab === 'venues'
                    ? 'text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapPin size={14} /> 会場
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {sidebarTab === 'persons' ? <StakeholderPanel /> : <VenuePanel />}
            </div>
          </aside>
        )}

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="sm:hidden fixed inset-0 z-40 flex">
            <div
              className="flex-1 bg-black/40"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="w-72 bg-white flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-gray-800">管理パネル</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex border-b">
                <button
                  onClick={() => setSidebarTab('persons')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium ${
                    sidebarTab === 'persons' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500'
                  }`}
                >
                  <Users size={14} /> 人物
                </button>
                <button
                  onClick={() => setSidebarTab('venues')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium ${
                    sidebarTab === 'venues' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500'
                  }`}
                >
                  <MapPin size={14} /> 会場
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {sidebarTab === 'persons' ? <StakeholderPanel /> : <VenuePanel />}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddSession && (
        <SessionModal
          eventId={event.id}
          date={activeDate}
          onClose={() => setShowAddSession(false)}
        />
      )}
    </div>
  );
}
