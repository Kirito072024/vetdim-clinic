import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useTheme } from '../hooks/useTheme.js';

const NAV = [
  { to: '/doctors', label: 'Лікарі' },
  { to: '/services', label: 'Послуги' },
  { to: '/contacts', label: 'Контакти' },
];

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="ВетДім — на головну">
      <span className="logo__mark">
        <Icon name="paw" />
      </span>
      <span className="logo__text">
        Вет<span>Дім</span>
      </span>
    </Link>
  );
}

export default function Header() {
  // Меню відкрите лише на тій сторінці, де його відкрили: перехід за посиланням закриває його автоматично
  const location = useLocation();
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === location.pathname;
  const setOpen = (value) => setOpenOn(value ? location.pathname : null);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();
  const headerRef = useRef(null);
  const burgerRef = useRef(null);

  // Тінь хедера при прокрутці
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Escape і клік поза меню закривають його
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenOn(null);
        burgerRef.current?.focus();
      }
    };
    const onClick = (e) => !headerRef.current?.contains(e.target) && setOpenOn(null);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [open]);

  const classes = ['site-header', open && 'nav-open', scrolled && 'is-scrolled'].filter(Boolean).join(' ');

  return (
    <header className={classes} ref={headerRef}>
      <div className="container site-header__inner">
        <Logo />
        <nav className="nav" id="main-nav" aria-label="Головна навігація">
          <ul className="nav__list">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink className="nav__link" to={item.to}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link className="btn btn--primary nav__cta" to="/booking">
            <Icon name="calendar" />
            Записатися
          </Link>
        </nav>
        <div className="site-header__actions">
          <button
            className="icon-btn theme-toggle"
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
          >
            <Icon name="moon" className="icon theme-toggle__moon" />
            <Icon name="sun" className="icon theme-toggle__sun" />
          </button>
          <button
            ref={burgerRef}
            className="icon-btn burger"
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Закрити меню' : 'Відкрити меню'}
            aria-expanded={open}
            aria-controls="main-nav"
          >
            <Icon name="menu" className="icon burger__open" />
            <Icon name="close" className="icon burger__close" />
          </button>
        </div>
      </div>
    </header>
  );
}
