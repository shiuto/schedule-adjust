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

  // Events CRUD
  addEvent: (e: Omit<Event, 'id' | 'createdAt'>) => Event;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;

  // Per-event person/venue selection
  toggleEventPerson: (eventId: string, personId: string) => void;
  toggleEventVenue: (eventId: string, venueId: string) => void;
  getEventPersons: (eventId: string) => Person[];
  getEventVenues: (eventId: string) => Venue[];

  // Persons CRUD
  addPerson: (p: Omit<Person, 'id'>) => Person;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  duplicatePerson: (id: string) => Person;

  // Venues CRUD
  addVenue: (v: Omit<Venue, 'id'>) => Venue;
  updateVenue: (id: string, updates: Partial<Venue>) => void;
  deleteVenue: (id: string) => void;

  // Areas CRUD
  addArea: (a: Omit<Area, 'id'>) => Area;
  updateArea: (id: string, updates: Partial<Area>) => void;
  deleteArea: (id: string) => void;
  duplicateArea: (id: string) => Area;

  // Sessions CRUD
  addSession: (s: Omit<Session, 'id'>) => Session;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  duplicateSession: (id: string) => Session;

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

      // Per-event selection helpers
      toggleEventPerson: (eventId, personId) => {
        set((s) => {
          const event = s.events.find((e) => e.id === eventId);
          if (!event) return s;
          const allIds = s.persons.map((p) => p.id);
          const current = event.eventPersonIds.length === 0 ? allIds : event.eventPersonIds;
          const next = current.includes(personId)
            ? current.filter((id) => id !== personId)
            : [...current, personId];
          // If all persons selected → reset to "all" mode (empty)
          const final = next.length === allIds.length ? [] : next;
          return {
            events: s.events.map((e) =>
              e.id === eventId ? { ...e, eventPersonIds: final } : e
            ),
          };
        });
      },

      toggleEventVenue: (eventId, venueId) => {
        set((s) => {
          const event = s.events.find((e) => e.id === eventId);
          if (!event) return s;
          const allIds = s.venues.map((v) => v.id);
          const current = event.eventVenueIds.length === 0 ? allIds : event.eventVenueIds;
          const next = current.includes(venueId)
            ? current.filter((id) => id !== venueId)
            : [...current, venueId];
          const final = next.length === allIds.length ? [] : next;
          return {
            events: s.events.map((e) =>
              e.id === eventId ? { ...e, eventVenueIds: final } : e
            ),
          };
        });
      },

      getEventPersons: (eventId) => {
        const { events, persons } = get();
        const event = events.find((e) => e.id === eventId);
        if (!event || event.eventPersonIds.length === 0) return persons;
        return persons.filter((p) => event.eventPersonIds.includes(p.id));
      },

      getEventVenues: (eventId) => {
        const { events, venues } = get();
        const event = events.find((e) => e.id === eventId);
        if (!event || event.eventVenueIds.length === 0) return venues;
        return venues.filter((v) => event.eventVenueIds.includes(v.id));
      },

      addEvent: (e) => {
        const event: Event = {
          ...e,
          id: generateId(),
          createdAt: new Date().toISOString(),
          eventPersonIds: e.eventPersonIds ?? [],
          eventVenueIds: e.eventVenueIds ?? [],
        };
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
          events: s.events.map((e) => ({
            ...e,
            eventPersonIds: e.eventPersonIds.filter((pid) => pid !== id),
          })),
          sessions: s.sessions.map((sess) => ({
            ...sess,
            personIds: sess.personIds.filter((pid) => pid !== id),
          })),
        })),
      duplicatePerson: (id) => {
        const src = get().persons.find((p) => p.id === id);
        if (!src) throw new Error('Person not found');
        const person = { ...src, id: generateId(), name: `${src.name} (コピー)` };
        set((s) => ({ persons: [...s.persons, person] }));
        return person;
      },

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
          events: s.events.map((e) => ({
            ...e,
            eventVenueIds: e.eventVenueIds.filter((vid) => vid !== id),
          })),
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
      duplicateArea: (id) => {
        const src = get().areas.find((a) => a.id === id);
        if (!src) throw new Error('Area not found');
        const area = { ...src, id: generateId(), name: `${src.name} (コピー)` };
        set((s) => ({ areas: [...s.areas, area] }));
        return area;
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
      duplicateSession: (id) => {
        const src = get().sessions.find((s) => s.id === id);
        if (!src) throw new Error('Session not found');
        const session = { ...src, id: generateId(), title: `${src.title} (コピー)` };
        set((s) => ({ sessions: [...s.sessions, session] }));
        return session;
      },

      exportData: () => {
        const { events, persons, venues, areas, sessions } = get();
        return JSON.stringify({ events, persons, venues, areas, sessions }, null, 2);
      },
      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            events: (data.events ?? []).map((e: Event) => ({
              ...e,
              eventPersonIds: e.eventPersonIds ?? [],
              eventVenueIds: e.eventVenueIds ?? [],
            })),
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
    {
      name: 'schedule-app-v1',
      // migrate old data without eventPersonIds/eventVenueIds
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.events = state.events.map((e) => ({
            ...e,
            eventPersonIds: e.eventPersonIds ?? [],
            eventVenueIds: e.eventVenueIds ?? [],
          }));
        }
      },
    }
  )
);
