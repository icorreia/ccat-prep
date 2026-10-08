import { Link, Route, Routes } from 'react-router';
import { Home } from './screens/Home';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">
          CCAT Prep
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}
