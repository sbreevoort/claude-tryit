import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import './Sidebar.css';

const STORAGE_KEY = 'sidebar-expanded';

const getInitialExpanded = (): boolean => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === 'true';
};

const Sidebar = () => {
  const [expanded, setExpanded] = useState(getInitialExpanded);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <aside className={clsx('sidebar', { 'sidebar--collapsed': !expanded })}>
      <button
        className="sidebar__toggle"
        type="button"
        onClick={toggle}
        aria-label={expanded ? 'Sidebar inklappen' : 'Sidebar uitklappen'}
      >
        {expanded ? '◀' : '▶'}
      </button>
      <nav className="sidebar__nav">
        <Link to="/" className="sidebar__link">
          <span className="sidebar__link-icon" aria-hidden="true">←</span>
          {expanded && <span className="sidebar__link-label">Terug naar Portaal</span>}
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
