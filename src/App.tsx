import { lazy, Suspense } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router';
import { Gallery } from './screens/Gallery';
import { Home } from './screens/Home';
import { Practice } from './screens/Practice';
import { Results } from './screens/Results';
import { Review } from './screens/Review';
import { TestRunner } from './screens/TestRunner';
import { HistoryProvider } from './store/historyContext';
import { SessionProvider } from './store/session';

// History pulls in the charting library; load it only when visited.
const History = lazy(() => import('./screens/History').then((m) => ({ default: m.History })));

export function App() {
  return (
    <HistoryProvider>
      <SessionProvider>
        <div className="app">
          <header className="app-header">
            <Link to="/" className="brand">
              CCAT Prep
            </Link>
            <nav>
              <NavLink to="/practice">Practice</NavLink>
              <NavLink to="/history">History</NavLink>
              <NavLink to="/gallery">Question gallery</NavLink>
            </nav>
          </header>
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/test" element={<TestRunner />} />
              <Route path="/results" element={<Results />} />
              <Route path="/review" element={<Review />} />
              <Route
                path="/history"
                element={
                  <Suspense fallback={<p className="muted">Loading…</p>}>
                    <History />
                  </Suspense>
                }
              />
            </Routes>
          </main>
        </div>
      </SessionProvider>
    </HistoryProvider>
  );
}
