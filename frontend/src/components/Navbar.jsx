import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/formatters';

export default function Navbar({ title, onMenuClick }) {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="menu-toggle" onClick={onMenuClick} aria-label="Toggle menu">
          <Menu size={18} />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right" ref={ref} style={{ position: 'relative' }}>
        <div className="topbar-user" style={{ cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
          <div className="topbar-avatar">{initials(user?.name)}</div>
          <div className="topbar-user-meta">
            <div className="topbar-user-name">{user?.name}</div>
            <div className="topbar-user-role">{user?.role}</div>
          </div>
          <ChevronDown size={15} color="var(--text-faint)" />
        </div>
        {open && (
          <div className="card" style={{
            position: 'absolute', right: 0, top: 46, width: 190, padding: 6, zIndex: 30,
          }}>
            <Link
              to={isAdmin ? '/admin/profile' : '/user/profile'}
              className="sidebar-link"
              style={{ color: 'var(--text)' }}
              onClick={() => setOpen(false)}
            >
              <UserCircle size={16} className="icon" /> My Profile
            </Link>
            <button
              className="sidebar-link"
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-out-fg)' }}
              onClick={logout}
            >
              <LogOut size={16} className="icon" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
