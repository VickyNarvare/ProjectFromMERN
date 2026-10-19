import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';

/* ---------- constants & helpers ---------- */
const CATEGORIES = ['DSA', 'Git', 'Technical'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];
const MC_STATES = ['Not started', 'In progress', 'Done'];
const Q_KEY = 'ipt.questions.v1';
const MC_KEY = 'ipt.machineCoding.v1';

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }, [key, value]);
  return [value, setValue];
}

const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');

/* ---------- small components ---------- */
function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <motion.span
        key={value}
        className="stat-value"
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {value}
      </motion.span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function MachineCodingCard({ state, onCycle }) {
  return (
    <button className={`stat stat-btn mc-${slug(state)}`} onClick={onCycle}>
      <span className="stat-value mc-value">{state}</span>
      <span className="stat-label">Machine coding</span>
      <span className="stat-sub">Tap to update</span>
    </button>
  );
}

function ProgressBar({ percent, done, total }) {
  return (
    <section className="progress" aria-label="Overall progress">
      <div className="progress-head">
        <h2>This week's progress</h2>
        <motion.span
          key={percent}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          {percent}%
        </motion.span>
      </div>
      <div
        className="track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="fill"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </div>
      <p className="muted">
        {total === 0
          ? 'Add a question to start tracking.'
          : `${done} of ${total} questions completed`}
      </p>
    </section>
  );
}

function QuestionForm({ onAdd, existing }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('DSA');
  const [difficulty, setDifficulty] = useState('Easy');
  const [status, setStatus] = useState('Pending');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const t = title.trim();
    if (t.length < 3) return setError('Enter at least 3 characters.');
    if (t.length > 120) return setError('Keep the title under 120 characters.');
    if (
      existing.some(
        (q) =>
          q.title.toLowerCase() === t.toLowerCase() && q.category === category
      )
    )
      return setError('This question is already in your list.');
    onAdd({
      id: crypto.randomUUID(),
      title: t,
      category,
      difficulty,
      status,
      createdAt: Date.now(),
    });
    setTitle('');
    setError('');
  };

  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <h2>Add a question</h2>
      <label>
        Question
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g. Merge two sorted lists"
          aria-invalid={!!error}
          aria-describedby="title-error"
        />
      </label>
      <AnimatePresence>
        {error && (
          <motion.p
            id="title-error"
            className="error"
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', x: [0, -6, 6, -3, 0] }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="row">
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Difficulty
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <motion.button
        className="primary"
        whileTap={{ scale: 0.97 }}
        type="submit"
      >
        Add question
      </motion.button>
    </form>
  );
}

function Filters({ filters, setFilters }) {
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const active =
    filters.search || filters.category || filters.status || filters.difficulty;
  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search questions"
        value={filters.search}
        onChange={set('search')}
        aria-label="Search questions"
      />
      <select
        value={filters.category}
        onChange={set('category')}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={set('status')}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <select
        value={filters.difficulty}
        onChange={set('difficulty')}
        aria-label="Filter by difficulty"
      >
        <option value="">All difficulties</option>
        {DIFFICULTIES.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      {active && (
        <button
          className="ghost"
          onClick={() =>
            setFilters({ search: '', category: '', status: '', difficulty: '' })
          }
        >
          Clear
        </button>
      )}
    </div>
  );
}

function QuestionItem({ q, onStatus, onDelete }) {
  return (
    <motion.li
      layout
      className={`item st-${slug(q.status)}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <div className="item-main">
        <p className="item-title">{q.title}</p>
        <div className="tags">
          <span className="tag">{q.category}</span>
          <span className={`tag diff-${q.difficulty.toLowerCase()}`}>
            {q.difficulty}
          </span>
        </div>
      </div>
      <div className="item-actions">
        <select
          value={q.status}
          onChange={(e) => onStatus(q.id, e.target.value)}
          aria-label={`Status for ${q.title}`}
        >
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <motion.button
          className="ghost danger"
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(q.id)}
          aria-label={`Delete ${q.title}`}
        >
          Delete
        </motion.button>
      </div>
    </motion.li>
  );
}

function EmptyState({ title, text }) {
  return (
    <motion.div
      className="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </motion.div>
  );
}

/* ---------- app ---------- */
export default function App() {
  const [questions, setQuestions] = useLocalStorage(Q_KEY, []);
  const [mc, setMc] = useLocalStorage(MC_KEY, MC_STATES[0]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    difficulty: '',
  });

  const stats = useMemo(() => {
    const done = (fn) =>
      questions.filter((q) => q.status === 'Completed' && fn(q)).length;
    const completed = done(() => true);
    return {
      total: questions.length,
      completed,
      dsa: done((q) => q.category === 'DSA'),
      interview: done((q) => q.category !== 'DSA'),
      percent: questions.length
        ? Math.round((completed / questions.length) * 100)
        : 0,
    };
  }, [questions]);

  const visible = useMemo(() => {
    const s = filters.search.trim().toLowerCase();
    return questions
      .filter(
        (q) =>
          (!s || q.title.toLowerCase().includes(s)) &&
          (!filters.category || q.category === filters.category) &&
          (!filters.status || q.status === filters.status) &&
          (!filters.difficulty || q.difficulty === filters.difficulty)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [questions, filters]);

  const add = (q) => setQuestions((prev) => [q, ...prev]);
  const remove = (id) =>
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  const setStatus = (id, status) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status } : q))
    );
  const cycleMc = () =>
    setMc((m) => MC_STATES[(MC_STATES.indexOf(m) + 1) % MC_STATES.length]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="app">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Interview practice</h1>
          <p className="muted">
            Log what you solve this week and see how far you've come.
          </p>
        </motion.header>

        <section className="stats" aria-label="Summary">
          <Stat label="Total questions" value={stats.total} />
          <Stat label="DSA solved" value={stats.dsa} />
          <Stat
            label="Interview questions done"
            value={stats.interview}
            sub="Git + Technical"
          />
          <MachineCodingCard state={mc} onCycle={cycleMc} />
        </section>

        <ProgressBar
          percent={stats.percent}
          done={stats.completed}
          total={stats.total}
        />

        <div className="layout">
          <QuestionForm onAdd={add} existing={questions} />

          <section className="panel list-panel">
            <h2>Your questions</h2>
            <Filters filters={filters} setFilters={setFilters} />
            <ul className="list">
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((q) => (
                  <QuestionItem
                    key={q.id}
                    q={q}
                    onStatus={setStatus}
                    onDelete={remove}
                  />
                ))}
              </AnimatePresence>
            </ul>
            {questions.length === 0 && (
              <EmptyState
                title="No questions yet"
                text="Add your first question using the form to start tracking your prep."
              />
            )}
            {questions.length > 0 && visible.length === 0 && (
              <EmptyState
                title="No matches"
                text="Nothing fits those filters. Try a different search or clear the filters."
              />
            )}
          </section>
        </div>
      </main>
    </MotionConfig>
  );
}
