import { useStore } from './store/useStore';
import { EventList } from './components/events/EventList';
import { EventDetailPage } from './pages/EventDetailPage';

function App() {
  const currentEventId = useStore((s) => s.currentEventId);
  return currentEventId ? <EventDetailPage /> : <EventList />;
}

export default App;
