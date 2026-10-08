import { Link } from 'react-router';
import { formatClock } from '../components/Timer';
import { SECONDS_PER_QUESTION, TEST_LENGTH, TIME_LIMIT_MS } from '../engine/testBuilder';

/** Where you should be on the countdown to keep an even 18 s per question. */
const CHECKPOINTS = [10, 20, 30, 40].map((question) => ({ question, left: TIME_LIMIT_MS - question * SECONDS_PER_QUESTION * 1000 }));

const SHORTCUTS: [string, string][] = [
  ['10% of a number', 'Move the decimal point one place left: 10% of 340 is 34. Then 5% is half of that (17), 15% is the two added (51), 20% is double (68).'],
  ['x% of y = y% of x', '8% of 25 is the same as 25% of 8, which is 2.'],
  ['Undoing a discount or rise', 'After 20% off, the price is 0.8 of the original, so divide by 0.8 (multiply by 1.25): $40 after 20% off was $50. Adding 20% to $40 ($48) is the classic trap answer.'],
  ['Percentage change', 'Change ÷ the starting value, never the ending one: 40 → 50 is +25%, but 50 → 40 is −20%.'],
  ['Fractions you should know', '1/8 = 12.5%, 1/6 ≈ 16.7%, 1/5 = 20%, 1/4 = 25%, 1/3 ≈ 33.3%, 3/8 = 37.5%, 2/3 ≈ 66.7%, 3/4 = 75%.'],
  ['Multiplying by 5 or 25', '× 5 is × 10 then halve; × 25 is × 100 then divide by 4: 36 × 25 = 3,600 ÷ 4 = 900.'],
  ['Averages', 'Guess a middle value and average the differences: for 47, 52, 49, 56 around 50, the differences −3, +2, −1, +6 sum to 4, so the mean is 50 + 4 ÷ 4 = 51.'],
  ['A missing value from an average', 'Target total minus what you have: to average 80 over 5 tests after 72, 85, 78, 90 (325), you need 400 − 325 = 75.'],
  ['Ratios', 'Turn the ratio into parts: 3 : 5 means 8 parts, so 3 : 5 of 64 is 24 and 40.'],
  ['Rates', 'Bring everything to "per one": 120 miles in 2 hours is 60 an hour, so 5 hours is 300. For two workers, add their per-hour rates.'],
  ['Use the answer choices', 'Estimate first, then pick the choice in range; for "which is next" questions, try a choice against the rule instead of solving from scratch.'],
];

export function Strategy() {
  return (
    <section className="strategy">
      <h1>Strategy</h1>
      <p>
        The CCAT gives {TEST_LENGTH} questions in {TIME_LIMIT_MS / 60_000} minutes, about {SECONDS_PER_QUESTION} seconds each, and many people don't reach the
        end. Your score is simply the number you get right, so a few habits are worth as much as extra knowledge.
      </p>

      <h2>Never leave a question blank</h2>
      <ul>
        <li>
          <strong>Wrong answers cost nothing.</strong> A blank and a wrong answer both score zero, so every question should get an answer.
        </li>
        <li>
          <strong>Guess instead of skipping.</strong> Skipping can't earn a point; a guess can. Most questions have 5 choices, so a blind guess is right about 1 time in 5
          (1 in 3 on true / false / uncertain questions), and better once you've ruled anything out.
        </li>
        <li>
          <strong>Save the last minute for guessing.</strong> When about a minute is left, stop solving and answer every remaining question as fast as you can click. Ten
          guesses at 1 in 5 are worth about 2 points.
        </li>
      </ul>

      <h2>Know when to move on</h2>
      <ul>
        <li>
          <strong>If there's no clear path after about 20 seconds,</strong> rule out what you can, pick the best remaining choice and go. You can't come back to it, and the
          time is worth more on the next question.
        </li>
        <li>
          <strong>Questions get harder as the test goes on,</strong> so the early ones are your cheapest points. Answer them carefully but quickly to bank time for later.
        </li>
        <li>
          <strong>Know your time sinks.</strong> The <Link to="/history">History</Link> page shows which question types take you longest and which ones you miss most;
          drill those from the question-type table.
        </li>
      </ul>

      <h3>Pacing checkpoints</h3>
      <p className="muted small">Even pace, read off the countdown. Since later questions are harder, try to be a little ahead of these.</p>
      <div className="table-scroll">
        <table className="stats">
          <thead>
            <tr>
              <th scope="col">After question</th>
              <th scope="col" className="num">
                Time left
              </th>
            </tr>
          </thead>
          <tbody>
            {CHECKPOINTS.map((c) => (
              <tr key={c.question}>
                <td>{c.question}</td>
                <td className="num">{formatClock(c.left)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Mental-math shortcuts</h2>
      <p className="muted small">There's no calculator, and the numbers are chosen to work out cleanly; if yours don't, check the question again.</p>
      <dl className="shortcuts">
        {SHORTCUTS.map(([term, how]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{how}</dd>
          </div>
        ))}
      </dl>

      <h2>By question type</h2>
      <ul>
        <li>
          <strong>Synonyms and antonyms:</strong> check which one the question asks for before reading the choices. A common trap is the word's opposite in a synonym question, or a near-synonym in an antonym one.
        </li>
        <li>
          <strong>Analogies:</strong> say the relation as a sentence ("a glove is worn on a hand") and test each choice in the same sentence.
        </li>
        <li>
          <strong>Syllogisms:</strong> use only what the statements say, not what's true in real life. "Some" means at least one, and if the conclusion could go either
          way, it's uncertain.
        </li>
        <li>
          <strong>Ordering puzzles:</strong> sketch the positions on paper and place the most constrained item first.
        </li>
        <li>
          <strong>Spatial series and matrices:</strong> check one attribute at a time (shape, fill, rotation, count, position) and cross out choices that break it.
        </li>
        <li>
          <strong>Tables and charts:</strong> read the question first, then find only the numbers it needs.
        </li>
      </ul>

      <h2>Practise it</h2>
      <p>
        Build speed with <Link to="/practice?timing=speed">speed training</Link> (18 seconds per question), then use <Link to="/">Crossover mode</Link> to train under
        a tighter clock than the real test.
      </p>
    </section>
  );
}
