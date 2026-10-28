import { NavLink, Outlet } from 'react-router-dom';
import { site } from '../config';

export default function Layout() {
  return (
    <div className="layout">
      <header className="nav">
        <NavLink to="/" className="nav-logo">
          ~/
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/blog">Blog</NavLink>
          <a href={site.links.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <span>
          © {new Date().getFullYear()} {site.owner.name} · Built with React + Vite · Deployed on GitHub Pages
        </span>
      </footer>
    </div>
  );
}
