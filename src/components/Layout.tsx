import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { site } from '../config';

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="layout">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
      <header className="nav">
        <NavLink to="/" className="nav-logo" aria-label={`${site.owner.name} home`}>~/{site.owner.handle}</NavLink>
        <nav className="nav-links" aria-label="Main navigation"><NavLink to="/" end>Home</NavLink>{site.features.blog && <NavLink to="/blog">Blog</NavLink>}<a href={site.links.github} target="_blank" rel="noreferrer">GitHub ↗</a></nav>
      </header>
      <main className="main" id="main-content" tabIndex={-1}><Outlet /></main>
      <footer className="footer">© {new Date().getFullYear()} {site.owner.name}</footer>
    </div>
  );
}
