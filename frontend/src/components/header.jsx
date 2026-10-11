import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import './header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/courses', label: 'Corsi' },
  { to: '/study-sessions', label: 'Sessioni' },
  { to: '/calendar', label: 'Calendario' },
  { to: '/statistics', label: 'Statistiche' },
  { to: '/pomodoro', label: 'Pomodoro' },
];

/**
 * Main navigation.
 *
 * Built on react-bootstrap's Navbar (already a dependency) rather than a
 * hand-rolled menu: it gives a real toggle button with aria-expanded and
 * aria-controls wired up, which the previous always-horizontal <ul> did not
 * have. Below 992px the six links used to run 723px wide and simply fall off
 * the screen, so every page scrolled sideways and most links were unreachable
 * on a phone.
 */
function Header() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  // Collapse the mobile menu whenever the route changes, so the panel does not
  // stay open on top of the page the user just navigated to.
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <Navbar
      as="header"
      expand="lg"
      expanded={expanded}
      onToggle={setExpanded}
      className="site-header"
      collapseOnSelect
    >
      <Container className="site-header__container">
        <Navbar.Brand as={Link} to="/" className="site-header__brand">
          <FontAwesomeIcon icon={faGraduationCap} className="site-header__logo" aria-hidden="true" />
          <span>MyStudy</span>
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="menu-principale"
          /* react-bootstrap's Navbar.Toggle sets aria-controls but not
             aria-expanded, so without this a screen reader never learns
             whether the menu is open. */
          aria-expanded={expanded}
          label="Apri o chiudi il menu di navigazione"
          className="site-header__toggle"
        />

        <Navbar.Collapse id="menu-principale">
          <Nav as="ul" className="ms-auto site-header__nav" aria-label="Navigazione principale">
            {LINKS.map(({ to, label }) => (
              <Nav.Item as="li" key={to}>
                <Nav.Link
                  as={Link}
                  to={to}
                  className={`site-header__link${isActive(to) ? ' is-active' : ''}`}
                  aria-current={isActive(to) ? 'page' : undefined}
                >
                  {label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
