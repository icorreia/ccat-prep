import { Link, NavLink, Route, Routes } from 'react-router';
import { Gallery } from './screens/Gallery';
import { Home } from './screens/Home';

export function App() {
  return (
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
        </Routes>
      </main>
    </div>
  );
}
