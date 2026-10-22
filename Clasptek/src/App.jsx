import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { useLenis } from 'lenis/react'
import { ArrowUpRight, Mail, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react'
import { COMPANY, NAV_LINKS } from './site/content.js'
import { useRevealMotion } from './site/useRevealMotion.js'
import './App.css'
import './site/pages.css'

const CURRENT_YEAR = new Date().getFullYear()

/** Returns to the top of the page — or to a hash target — on route change. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const lenis = useLenis()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        window.requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'auto', block: 'start' })
          lenis?.scrollTo(target, { immediate: true })
        })
        return
      }
    }
    window.scrollTo(0, 0)
    lenis?.scrollTo(0, { immediate: true })
  }, [hash, lenis, pathname])

  return null
}

function SiteHeader({ menuOpen, onNavigate, scrolled }) {
  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="site-header-inner">
        <Link className="wordmark" to="/" aria-label={`${COMPANY.shortName} home`} onClick={onNavigate}>
          <img
            className="wordmark-logo"
            src="/claspconstruction-logo.svg"
            alt={`${COMPANY.legalName} — ${COMPANY.tagline}`}
          />
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => onNavigate('toggle')}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav
          className={`primary-nav ${menuOpen ? 'nav-open' : ''}`}
          aria-label="Main navigation"
        >
          {NAV_LINKS.map(({ label, to, accent }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={accent ? 'nav-contact' : undefined}
              onClick={onNavigate}
            >
              {label}
              {accent && <ArrowUpRight size={14} />}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link className="wordmark footer-wordmark" to="/">
            <img
              className="wordmark-logo"
              src="/claspconstruction-logo.svg"
              alt={`${COMPANY.legalName} — ${COMPANY.tagline}`}
            />
          </Link>
          <p>{COMPANY.tagline}</p>
        </div>
        <nav className="footer-nav" aria-label="Footer navigation">
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
          <Link to="/portal">Tenant Portal</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>
          © {CURRENT_YEAR} {COMPANY.legalName}. ALL RIGHTS RESERVED.
        </span>
        <span><MapPin size={11} /> {COMPANY.location}</span>
        <a href={COMPANY.phoneLink}><Phone size={11} /> {COMPANY.phoneDisplay}</a>
        <a href={`mailto:${COMPANY.email}`}><Mail size={11} /> {COMPANY.email}</a>
      </div>
    </footer>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const prefersReducedMotion = useReducedMotion()

  useRevealMotion(pathname)

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 50)
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  const closeMenu = () => setMenuOpen(false)
  const handleNavigate = (action) => {
    if (action === 'toggle') setMenuOpen((open) => !open)
    else closeMenu()
  }

  return (
    <div className="site-shell">
      <ScrollToTop />
      <SiteHeader
        menuOpen={menuOpen}
        onNavigate={handleNavigate}
        scrolled={scrolled}
      />

      <main id="main-content">
        <Outlet />
      </main>

      <SiteFooter />

      <motion.a
        className="whatsapp-float"
        href={COMPANY.whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label={`Chat with ${COMPANY.shortName} on WhatsApp`}
        whileHover={prefersReducedMotion ? undefined : { y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <MessageCircle size={18} />
        <span>WHATSAPP US</span>
        <ArrowUpRight size={13} />
      </motion.a>
    </div>
  )
}
