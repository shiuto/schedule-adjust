import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Event, Person, Venue, Area, Session } from '../types';
import { generateId } from '../utils/time';

interface AppState {
  events: Event[];
  persons: Person[];
  venues: Venue[];
  areas: Area[];
  sessions: Session[];

  currentEventId: string | null;
  currentDate: string | null;
  setCurrentEvent: (id: string | null) => void;
  setCurrentDate: (date: string | null) => void;

  addEvent: (e: Omit<Event, 'id' | 'createdAt'>) => Event;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;

  addPerson: (p: Omit<Person, 'id'>) => Person;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;

  addVenue: (v: Omit<Venue, 'id'>) => Venue;
  updateVenue: (id: string, updates: Partial<Venue>) => void;
  deleteVenue: (id: string) => void;

  addArea: (a: Omit<Area, 'id'>) => Area;
  updateArea: (id: string, updates: Partial<Area>) => void;
  deleteArea: (id: string) => void;

  addSession: (s: Omit<Session, 'id'>) => Session;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;

  exportData: () => string;
  importData: (json: string) => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      events: [],
      persons: [],
      venues: [],
      areas: [],
      sessions: [],
      currentEventId: null,
      currentDate: null,

      setCurrentEvent: (id) => set({ currentEventId: id, currentDate: null }),
      setCurrentDate: (date) => set({ currentDate: date }),

      addEvent: (e) => {
        const event = { ...e, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ events: [...s.events, event] }));
        return event;
      },
      updateEvent: (id, updates) =>
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
      deleteEvent: (id) =>
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
          sessions: s.sessions.filter((sess) => sess.eventId !== id),
          currentEventId: s.currentEventId === id ? null : s.currentEventId,
        })),

      addPerson: (p) => {
        const person = { ...p, id: generateId() };
        set((s) => ({ persons: [...s.persons, person] }));
        return person;
      },
      updatePerson: (id, updates) =>
        set((s) => ({ persons: s.persons.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
      deletePerson: (id) =>
        set((s) => ({
          persons: s.persons.filter((p) => p.id !== id),
          sessions: s.sessions.map((sess) => ({
            ...sess,
            personIds: sess.personIds.filter((pid) => pid !== id),
          })),
        })),

      addVenue: (v) => {
        const venue = { ...v, id: generateId() };
        set((s) => ({ venues: [...s.venues, venue] }));
        return venue;
      },
      updateVenue: (id, updates) =>
        set((s) => ({ venues: s.venues.map((v) => (v.id === id ? { ...v, ...updates } : v)) })),
      deleteVenue: (id) =>
        set((s) => ({
          venues: s.venues.filter((v) => v.id !== id),
          areas: s.areas.filter((a) => a.venueId !== id),
        })),

      addArea: (a) => {
        const area = { ...a, id: generateId() };
        set((s) => ({ areas: [...s.areas, area] }));
        return area;
      },
      updateArea: (id, updates) =>
        set((s) => ({ areas: s.areas.map((a) => (a.id === id ? { ...a, ...updates } : a)) })),
      deleteArea: (id) => {
        const collectIds = (areaId: string, areas: Area[]): string[] => {
          const children = areas.filter((a) => a.parentId === areaId);
          return [areaId, ...children.flatMap((c) => collectIds(c.id, areas))];
        };
        set((s) => {
          const toDelete = new Set(collectIds(id, s.areas));
          return {
            areas: s.areas.filter((a) => !toDelete.has(a.id)),
            sessions: s.sessions.map((sess) => ({
              ...sess,
              areaId: sess.areaId && toDelete.has(sess.areaId) ? null : sess.areaId,
            })),
          };
        });
      },

      addSession: (sess) => {
        const session = { ...sess, id: generateId() };
        set((s) => ({ sessions: [...s.sessions, session] }));
        return session;
      },
      updateSession: (id, updates) =>
        set((s) => ({
          sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, ...updates } : sess)),
        })),
      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) })),

      exportData: () => {
        const { events, persons, venues, areas, sessions } = get();
        return JSON.stringify({ events, persons, venues, areas, sessions }, null, 2);
      },
      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            events: data.events ?? [],
            persons: data.persons ?? [],
            venues: data.venues ?? [],
            areas: data.areas ?? [],
            sessions: data.sessions ?? [],
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    { name: 'schedule-app-v1' }
  )
);
