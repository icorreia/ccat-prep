import { Link, useNavigate } from 'react-router';
import { useSession } from '../store/session';

export function Home() {
  const { startTest } = useSession();
  const navigate = useNavigate();
  return (
    <section>
      <h1>CCAT practice</h1>
      <p>
        50 questions · 15 minutes · no calculator · no going back. Verbal, math &amp; logic and spatial questions are
        mixed together and get harder as you go. Wrong answers cost nothing, so answer everything you can.
      </p>
      <div className="runner-actions">
        <button
          type="button"
          className="primary"
          onClick={() => {
            startTest();
            navigate('/test');
          }}
        >
          Start full test
        </button>
        <Link to="/gallery">Browse questions</Link>
      </div>
      <p className="muted small">Keep scratch paper and a pen nearby, like on the real test.</p>
    </section>
  );
}
