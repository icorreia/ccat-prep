import { Link, NavLink, Route, Routes } from 'react-router';
import { Gallery } from './screens/Gallery';
import { Home } from './screens/Home';
import { Results } from './screens/Results';
import { TestRunner } from './screens/TestRunner';
import { SessionProvider } from './store/session';

export function App() {
  return (
    <SessionProvider>
      <div className="app">
        <header className="app-header">
          <Link to="/" className="brand">
            CCAT Prep
          </Link>
          <nav>
            <NavLink to="/gallery">Question gallery</NavLink>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/test" element={<TestRunner />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>
      </div>
    </SessionProvider>
  );
}
