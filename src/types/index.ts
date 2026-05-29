export interface Event {
  id: string;
  name: string;
  description: string;
  dates: string[];
  createdAt: string;
  eventPersonIds: string[];  // empty = all persons
  eventVenueIds: string[];   // empty = all venues
}

export interface Person {
  id: string;
  name: string;
  role: string;
  group: string;
  color: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
}

export interface Area {
  id: string;
  venueId: string;
  parentId: string | null;
  name: string;
  color: string;
  depth: number;
}

export interface Session {
  id: string;
  eventId: string;
  date: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  personIds: string[];
  areaId: string | null;
  color: string | null;
}
