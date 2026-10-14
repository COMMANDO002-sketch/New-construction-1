import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLenis } from 'lenis/react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  Heart,
  House,
  KeyRound,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  MoveUpRight,
  X,
} from 'lucide-react'
import {
  cardHover,
  fadeUp,
  goldShimmer,
  luxuryEase,
  modalBackdrop,
  modalContent,
  staggerContainer,
  useCountUp,
} from './animations.js'
import './App.css'

const WHATSAPP_LINK = 'https://wa.me/2349025317736'
const CURRENT_YEAR = new Date().getFullYear()

const properties = [
  {
    id: 'duplex-01',
    title: 'The Alder Residence',
    type: '4 Bedroom Duplex',
    detail: 'A considered family home, made for the way you live.',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85',
    label: '4 BEDROOMS',
  },
  {
    id: 'bungalow-01',
    title: 'The Olivine Bungalow',
    type: '3 Bedroom Bungalow',
    detail: 'Effortless single-level living in a private setting.',
    image:
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85',
    label: '3 BEDROOMS',
  },
  {
    id: 'duplex-02',
    title: 'The Meridian House',
    type: '3 Bedroom Duplex',
    detail: 'Thoughtful proportions, natural light, room to grow.',
    image:
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85',
    label: '3 BEDROOMS',
  },
  {
    id: 'bungalow-02',
    title: 'The Solace Bungalow',
    type: '3 Bedroom Bungalow',
    detail: 'Calm, contemporary spaces with a sense of home.',
    image:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85',
    label: '3 BEDROOMS',
  },
  {
    id: 'duplex-03',
    title: 'The Linden Residence',
    type: '4 Bedroom Duplex',
    detail: 'A graceful retreat with space for every generation.',
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85',
    label: '4 BEDROOMS',
  },
  {
    id: 'duplex-04',
    title: 'The Ashford House',
    type: '4 Bedroom Duplex',
    detail: 'Modern architecture, grounded in everyday comfort.',
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=85',
    label: '4 BEDROOMS',
  },
]

const services = [
  {
    number: '01',
    icon: Compass,
    title: 'Construction & design',
    description:
      'Residential and commercial construction, estate development, architectural design and 3D visualisation.',
    link: 'Discuss a project',
  },
  {
    number: '02',
    icon: House,
    title: 'Homes at Blue Stone',
    description:
      'Discover thoughtfully designed 3 and 4 bedroom duplexes and bungalows at Blue Stone Estate, Mowe.',
    link: 'Explore the homes',
  },
  {
    number: '03',
    icon: KeyRound,
    title: 'Estate management',
    description:
      'Rent and service charge management, facility maintenance, security and tenant screening.',
    link: 'Talk to our team',
  },
]

const advantages = [
  { icon: Clock3, title: '20 minutes to Berger', detail: 'Conveniently connected via the Lagos–Ibadan Expressway.' },
  { icon: BadgeCheck, title: 'Verified C of O', detail: '100% verified Certificate of Occupancy.' },
  { icon: ShieldCheck, title: 'No Omonile issues', detail: 'A more assured path to owning your home.' },
  { icon: MapPin, title: 'A growing address', detail: 'Blue Stone Estate, Mowe-Ofada, Ogun State.' },
]

const stats = [
  { value: '80+', label: 'Homes delivered' },
  { value: '3', label: 'Estates managed' },
  { value: '100%', label: 'Verified C of O' },
  { value: '20 min', label: 'To Berger' },
]

function AnimatedCount({ value }) {
  const { formattedCount, ref } = useCountUp(value)
  return <motion.span ref={ref}>{formattedCount}</motion.span>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [filter, setFilter] = useState('All homes')
  const [favourites, setFavourites] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const prefersReducedMotion = useReducedMotion()
  const lenis = useLenis()
  const heroRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 50)
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return undefined

    let cancelled = false
    let context
    let stopPerformanceMonitor

    const initializeCinematicMotion = async () => {
      const [gsapModule, scrollTriggerModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled || !heroRef.current) return

      const gsap = gsapModule.gsap
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger
      gsap.registerPlugin(ScrollTrigger)
      gsap.ticker.fps(60)
      ScrollTrigger.config({ limitCallbacks: true })

      const parallaxTweens = []
      let lastFrameTime = performance.now()
      let slowFrameCount = 0
      const isLowPowerDevice =
        window.matchMedia('(max-width: 700px)').matches ||
        (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)
      const monitorPerformance = () => {
        const now = performance.now()
        slowFrameCount = now - lastFrameTime > 1000 / 45 ? slowFrameCount + 1 : 0
        lastFrameTime = now

        if (slowFrameCount >= 12) {
          parallaxTweens.forEach((tween) => {
            tween.scrollTrigger?.kill()
            tween.kill()
          })
          gsap.ticker.remove(monitorPerformance)
        }
      }

      context = gsap.context(() => {
        const timeline = gsap.timeline({ defaults: { ease: luxuryEase } })
        timeline
          .fromTo(
            '.hero-image-frame',
            { opacity: 0, scale: 1.03 },
            { opacity: 1, scale: 1, duration: 1.1 },
            0,
          )
          .fromTo('.hero-reveal-line', { scaleX: 0 }, { scaleX: 1, duration: 0.8 }, 0)
          .fromTo(
            '.wordmark-logo',
            { opacity: 0, scale: 0.97 },
            { opacity: 1, scale: 1, duration: 0.6 },
            '-=0.35',
          )
          .fromTo('.site-header-inner', { yPercent: -100 }, { yPercent: 0, duration: 0.8 }, 0.2)
          .fromTo(
            '.hero-word',
            { yPercent: 110 },
            { yPercent: 0, duration: 0.8, stagger: 0.08 },
            '-=0.25',
          )
          .fromTo(
            '.hero-eyebrow',
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.6 },
            '<',
          )
          .fromTo(
            '.hero-description',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6 },
            '+=0.1',
          )
          .fromTo(
            '.hero-actions .button',
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1 },
            '+=0.2',
          )
          .fromTo(
            '.hero-bottomline',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.5 },
            '-=0.2',
          )

        gsap.to('.hero-image-frame', {
          scale: 1.15,
          duration: 10,
          ease: 'none',
          delay: 1.1,
          repeat: -1,
          yoyo: true,
        })

        gsap.utils.toArray('.reveal-heading').forEach((element) => {
          gsap.fromTo(
            element,
            { clipPath: 'inset(0 100% 0 0)' },
            {
              clipPath: 'inset(0 0% 0 0)',
              duration: 1,
              ease: luxuryEase,
              scrollTrigger: { trigger: element, start: 'top 82%', once: true },
            },
          )
        })

        gsap.utils.toArray('.reveal-copy').forEach((element) => {
          gsap.fromTo(
            element,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: luxuryEase,
              scrollTrigger: { trigger: element, start: 'top 88%', once: true },
            },
          )
        })

        gsap.utils.toArray('.reveal-divider').forEach((element) => {
          gsap.fromTo(
            element,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.8,
              ease: luxuryEase,
              transformOrigin: 'left center',
              scrollTrigger: { trigger: element, start: 'top 90%', once: true },
            },
          )
        })

        gsap.utils.toArray('.story-image').forEach((image) => {
          gsap.fromTo(
            image,
            { scale: 1.12, clipPath: 'inset(8% 0 8% 0)' },
            {
              scale: 1,
              clipPath: 'inset(0 0 0 0)',
              duration: 1.2,
              ease: luxuryEase,
              scrollTrigger: { trigger: image, start: 'top 90%', once: true },
            },
          )

          if (!isLowPowerDevice) {
            const parallaxTween = gsap.fromTo(
              image,
              { yPercent: -4 },
              {
                yPercent: 4,
                ease: 'none',
                scrollTrigger: {
                  trigger: image,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            )
            parallaxTweens.push(parallaxTween)
          }
        })

        if (parallaxTweens.length) {
          gsap.ticker.add(monitorPerformance)
          stopPerformanceMonitor = () => gsap.ticker.remove(monitorPerformance)
        }

        ScrollTrigger.refresh()
      }, document.body)
    }

    initializeCinematicMotion()
    return () => {
      cancelled = true
      stopPerformanceMonitor?.()
      context?.revert()
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion || !lenis) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lenis.stop()
    const timeout = window.setTimeout(() => {
      document.body.style.overflow = previousOverflow
      lenis.start()
    }, 1200)

    return () => {
      window.clearTimeout(timeout)
      document.body.style.overflow = previousOverflow
      lenis.start()
    }
  }, [lenis, prefersReducedMotion])

  useEffect(() => {
    if (!selectedProperty) {
      previousFocusRef.current?.focus()
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lenis?.stop()
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedProperty(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
      lenis?.start()
    }
  }, [lenis, selectedProperty])

  const visibleProperties =
    filter === 'All homes'
      ? properties
      : properties.filter((property) => property.type.includes(filter))

  const toggleFavourite = (id) => {
    setFavourites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const closeMenu = () => setMenuOpen(false)
  const openProperty = (property, trigger) => {
    previousFocusRef.current = trigger
    setSelectedProperty(property)
  }

  return (
    <div className="site-shell">
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="site-header-inner">
          <a className="wordmark" href="#home" aria-label="Clasptek home" onClick={closeMenu}>
            <img className="wordmark-logo" src="/clasptek-logo.png" alt="CLASPTEK — Build. House. Manage." />
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav className={`primary-nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
            <a href="#properties" onClick={closeMenu}>The homes</a>
            <a href="#expertise" onClick={closeMenu}>What we do</a>
            <a href="#blue-stone" onClick={closeMenu}>Blue Stone</a>
            <a href="#about" onClick={closeMenu}>Our story</a>
            <a className="nav-contact" href="#contact" onClick={closeMenu}>
              Let&apos;s talk <ArrowUpRight size={14} />
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero-section" id="home" ref={heroRef}>
          <div className="hero-image-frame">
            {/* REPLACE WITH REAL BLUE STONE PIC */}
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=90"
              alt="Contemporary luxury residence framed by mature trees"
              fetchPriority="high"
            />
          </div>
          <div className="hero-shade" />
          <span className="hero-reveal-line" aria-hidden="true" />
          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow"><span /> BUILT WITH INTENTION. MANAGED WITH CARE.</p>
              <h1 className="hero-headline" aria-label="BUILD. HOUSE. MANAGE.">
                <span className="hero-word-mask"><span className="hero-word">BUILD.</span></span>
                <span className="hero-word-mask"><span className="hero-word">HOUSE.</span></span>
                <span className="hero-word-mask"><span className="hero-word hero-word-accent">MANAGE.</span></span>
              </h1>
              <p className="hero-description">
                CLASPTEK — BUILD. HOUSE. MANAGE.
                <br />
                Exceptional homes at Blue Stone, Mowe. Thoughtfully built since 2020.
              </p>
              <div className="hero-actions">
                <motion.a
                  className="button button-gold"
                  href="#properties"
                  animate={prefersReducedMotion ? undefined : 'shimmer'}
                  variants={goldShimmer}
                  whileHover={{ y: -2, boxShadow: '0 10px 20px rgba(212, 175, 55, 0.3)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Discover the homes <ArrowRight size={16} />
                </motion.a>
                <motion.a
                  className="button button-outline"
                  href="#contact"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Build with us <ArrowUpRight size={15} />
                </motion.a>
              </div>
            </div>
            <div className="hero-bottomline">
              <span>BLUE STONE ESTATE <i /> MOWE-OFADA, OGUN STATE</span>
              <a href="#intro"><span className="scroll-mouse" aria-hidden="true"><i /></span> SCROLL TO EXPLORE <ArrowDown size={13} /></a>
            </div>
          </div>
          <div className="hero-index"><span>01</span> — 04</div>
        </section>

        <section className="intro-section section-pad" id="intro">
          <div className="intro-kicker">
            <span className="eyebrow">A PLACE TO PUT DOWN ROOTS</span>
            <span className="intro-rule reveal-divider" />
          </div>
          <div className="intro-content">
            <h2 className="display-heading reveal-heading">Thoughtfully built.<br /><em>Beautifully lived.</em></h2>
            <div className="intro-copy reveal-copy">
              <p>
                From the first architectural sketch to the keys in your hand, we create
                places that feel considered, secure and unmistakably yours.
              </p>
              <a className="text-link" href="#about">Get to know CLASPTEK <ArrowUpRight size={15} /></a>
            </div>
          </div>
          <div className="stats-row">
            {stats.map((stat) => (
              <div className="stat-item" key={stat.label}>
                <span className="stat-value"><AnimatedCount value={stat.value} /></span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="homes-section section-pad" id="properties">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-mark">02</span> A HOME AT BLUE STONE</p>
              <h2 className="display-heading reveal-heading">Room for the life<br /><em>you want to live.</em></h2>
            </div>
            <p className="section-heading-note reveal-copy">
              Explore our home designs at Blue Stone Estate, Mowe. Get in touch for current
              availability and pricing.
            </p>
          </div>
          <div className="property-toolbar">
            <div className="property-filters" role="group" aria-label="Filter home designs">
              {['All homes', 'Duplex', 'Bungalow'].map((item) => (
                <button
                  className={`filter-button ${filter === item ? 'filter-active' : ''}`}
                  key={item}
                  type="button"
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <span className="results-count">BLUE STONE, MOWE <i /> {visibleProperties.length} HOME DESIGNS</span>
          </div>
          <div className="property-grid">
            {visibleProperties.map((property, index) => (
              <motion.article
                className="property-card"
                key={property.id}
                initial={prefersReducedMotion ? 'visible' : 'hidden'}
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7, delay: index * 0.12, ease: luxuryEase }}
                whileHover={cardHover}
              >
                <div className="property-image-wrap">
                  {/* REPLACE WITH REAL BLUE STONE PIC */}
                  <motion.button
                    className="property-open-button"
                    type="button"
                    aria-label={`View ${property.title} design concept`}
                    onClick={(event) => openProperty(property, event.currentTarget)}
                    whileTap={{ scale: 0.99 }}
                  >
                  <motion.img
                    className="property-image"
                    layoutId={`property-image-${property.id}`}
                    src={property.image}
                    alt={`${property.type} architectural home design`}
                    loading="lazy"
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                  </motion.button>
                  <span className="property-type">{property.label}</span>
                  <motion.button
                    className={`favourite-button ${favourites.includes(property.id) ? 'is-favourite' : ''}`}
                    type="button"
                    aria-label={`${favourites.includes(property.id) ? 'Remove' : 'Add'} ${property.title} ${favourites.includes(property.id) ? 'from' : 'to'} favourites`}
                    aria-pressed={favourites.includes(property.id)}
                    onClick={() => toggleFavourite(property.id)}
                    whileTap={{ scale: 0.8 }}
                    animate={favourites.includes(property.id) ? { scale: [0.8, 1.2, 1] } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Heart size={17} fill={favourites.includes(property.id) ? 'currentColor' : 'none'} />
                  </motion.button>
                  <span className="image-index">0{index + 1} / 06</span>
                </div>
                <div className="property-info">
                  <div className="property-name-row">
                    <div>
                      <p className="property-location"><MapPin size={12} /> BLUE STONE ESTATE, MOWE</p>
                      <button
                        className="property-open-title"
                        type="button"
                        onClick={(event) => openProperty(property, event.currentTarget)}
                      >
                        {property.title}
                      </button>
                    </div>
                    <span className="property-arrow"><ArrowUpRight size={16} /></span>
                  </div>
                  <div className="property-details">
                    <span>{property.type}</span>
                    <span>Price on request</span>
                  </div>
                  <p className="property-description">{property.detail}</p>
                  <a className="property-enquire" href={`${WHATSAPP_LINK}?text=${encodeURIComponent(`Hello CLASPTEK, I would like to enquire about ${property.title} at Blue Stone Estate.`)}`}>
                    Enquire about this home <ArrowRight size={14} />
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
          <p className="property-disclaimer">
            Home designs shown for illustration. Images are representative; enquire with our team for
            verified listings, current availability and pricing.
          </p>
        </section>

        <section className="blue-stone-section" id="blue-stone">
          <div className="blue-stone-image">
            {/* REPLACE WITH REAL BLUE STONE PIC */}
            <img
              className="story-image"
              src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85"
              alt="Modern home with warm evening light"
              loading="lazy"
            />
            <div className="image-caption"><span>06° 48&apos; N</span><span>03° 26&apos; E</span></div>
          </div>
          <div className="blue-stone-copy">
            <p className="eyebrow"><span className="eyebrow-mark">03</span> LIFE, A LITTLE MORE OPEN</p>
            <h2 className="display-heading reveal-heading">Find your<br /><em>own direction.</em></h2>
            <p className="blue-stone-intro reveal-copy">
              Set in Mowe-Ofada, Blue Stone brings a more considered way of living to Ogun State.
              Connected to the Lagos–Ibadan Expressway, yet with room to breathe.
            </p>
            <div className="advantage-list">
              {advantages.map(({ icon: Icon, title, detail }) => (
                <div className="advantage-item" key={title}>
                  <span className="advantage-icon"><Icon size={17} strokeWidth={1.5} /></span>
                  <div><h3>{title}</h3><p>{detail}</p></div>
                  <Check className="advantage-check" size={15} />
                </div>
              ))}
            </div>
            <motion.a
              className="button button-gold"
              href={`${WHATSAPP_LINK}?text=${encodeURIComponent('Hello CLASPTEK, I would like to arrange an inspection at Blue Stone Estate.')}`}
              animate={prefersReducedMotion ? undefined : 'shimmer'}
              variants={goldShimmer}
              whileHover={{ y: -2, boxShadow: '0 10px 20px rgba(212, 175, 55, 0.3)' }}
              whileTap={{ scale: 0.97 }}
            >
              Arrange an inspection <ArrowRight size={16} />
            </motion.a>
          </div>
        </section>

        <section className="expertise-section section-pad" id="expertise">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-mark">04</span> OUR EXPERTISE</p>
              <h2 className="display-heading reveal-heading">More than a place.<br /><em>A promise kept.</em></h2>
            </div>
            <p className="section-heading-note reveal-copy">
              One trusted partner for creating exceptional places and caring for them well.
            </p>
          </div>
          <motion.div
            className="service-grid"
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true, margin: '-100px' }}
          >
            {services.map(({ number, icon: Icon, title, description, link }) => (
              <motion.article
                className="service-card"
                key={number}
                variants={fadeUp}
                whileHover={{ y: -5, borderColor: 'rgba(145, 117, 48, 0.55)', transition: { duration: 0.22 } }}
              >
                <div className="service-topline"><span>{number}</span><Icon size={22} strokeWidth={1.4} /></div>
                <h3>{title}</h3>
                <p>{description}</p>
                <a href="#contact" className="text-link">{link} <ArrowUpRight size={14} /></a>
              </motion.article>
            ))}
          </motion.div>
          <p className="service-note">CLASPTEK does not offer renovation services.</p>
        </section>

        <section className="process-section section-pad" id="about">
          <div className="process-image">
            {/* REPLACE WITH REAL BLUE STONE PIC */}
            <img
              className="story-image"
              src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85"
              alt="Architectural detail of a contemporary residence"
              loading="lazy"
            />
            <span className="process-image-label">CLASPTEK <i /> EST. 2020</span>
          </div>
          <div className="process-copy">
            <p className="eyebrow"><span className="eyebrow-mark">05</span> A NOTE FROM CLASPTEK</p>
            <h2 className="display-heading reveal-heading">Good work<br />speaks <em>for itself.</em></h2>
            <p className="process-body reveal-copy">
              Since 2020, CLASPTEK has been building with purpose and managing with care. We believe
              confidence comes from doing the fundamentals exceptionally well: quality, integrity
              and timely delivery.
            </p>
            <div className="values-row">
              <span>QUALITY</span><i /><span>INTEGRITY</span><i /><span>TIMELY DELIVERY</span>
            </div>
            <a className="text-link" href="#contact">Start a conversation <ArrowUpRight size={15} /></a>
          </div>
        </section>

        <section className="quote-section">
          <div className="quote-ornament" aria-hidden="true">“</div>
          <p className="eyebrow">THE CLASPTEK STANDARD</p>
          <blockquote className="reveal-heading">
            Exceptional homes begin with a promise.
            <br />
            We make sure it lasts.
          </blockquote>
          <span className="quote-rule reveal-divider" />
          <span className="quote-credit">BUILD. HOUSE. MANAGE.</span>
        </section>

        <section className="contact-section section-pad" id="contact">
          <div className="contact-heading">
            <p className="eyebrow"><span className="eyebrow-mark">06</span> YOUR NEXT CHAPTER</p>
            <h2 className="display-heading reveal-heading">Let&apos;s make<br /><em>it happen.</em></h2>
          </div>
          <div className="contact-content reveal-copy">
            <p>Looking for a home at Blue Stone, planning a build, or need a dependable estate partner? We&apos;re listening.</p>
            <motion.a
              className="button button-gold"
              href={`${WHATSAPP_LINK}?text=${encodeURIComponent('Hello CLASPTEK, I would like to speak with your team.')}`}
              animate={prefersReducedMotion ? undefined : 'shimmer'}
              variants={goldShimmer}
              whileHover={{ y: -2, boxShadow: '0 10px 20px rgba(212, 175, 55, 0.3)' }}
              whileTap={{ scale: 0.97 }}
            >
              Start a conversation <ArrowUpRight size={16} />
            </motion.a>
            <div className="contact-details">
              <a href="tel:+2349025317736"><Phone size={15} /> +234 902 531 7736</a>
              <a href="mailto:info@clasptek.com">info@clasptek.com <ArrowUpRight size={13} /></a>
              <span><MapPin size={15} /> Blue Stone Estate, Mowe-Ofada, Ogun State</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <a className="wordmark footer-wordmark" href="#home">
            <img className="wordmark-logo" src="/clasptek-logo.png" alt="CLASPTEK — Build. House. Manage." />
          </a>
          <p>Building exceptional homes<br />since 2020.</p>
          <a className="back-to-top" href="#home">BACK TO TOP <ChevronDown size={14} /></a>
        </div>
        <div className="footer-bottom">
          <span>© {CURRENT_YEAR} CLASPTEK. ALL RIGHTS RESERVED.</span>
          <span>BLUE STONE ESTATE <i /> MOWE-OFADA, OGUN STATE</span>
          <a href="mailto:info@clasptek.com">INFO@CLASPTEK.COM</a>
        </div>
      </footer>

      <motion.a
        className="whatsapp-float"
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with CLASPTEK on WhatsApp"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <Phone size={18} />
        <span>LET&apos;S TALK</span>
        <MoveUpRight size={13} />
      </motion.a>

      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            className="property-modal-backdrop"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelectedProperty(null)
            }}
          >
            <motion.section
              className="property-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="property-modal-title"
              aria-describedby="property-modal-disclaimer"
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <button
                className="property-modal-close"
                type="button"
                aria-label="Close home design details"
                onClick={() => setSelectedProperty(null)}
                autoFocus
              >
                <X size={19} />
              </button>
              {/* REPLACE WITH REAL BLUE STONE PIC */}
              <motion.img
                className="property-modal-image"
                layoutId={`property-image-${selectedProperty.id}`}
                src={selectedProperty.image}
                alt={`${selectedProperty.type} architectural home design`}
              />
              <div className="property-modal-content">
                <p className="eyebrow">BLUE STONE ESTATE <span className="eyebrow-mark" /> MOWE</p>
                <h2 id="property-modal-title">{selectedProperty.title}</h2>
                <p className="property-modal-type">{selectedProperty.type}</p>
                <p className="property-modal-detail">{selectedProperty.detail}</p>
                <p className="property-modal-disclaimer" id="property-modal-disclaimer">
                  Illustrative design concept only. Contact CLASPTEK to confirm verified homes,
                  availability and pricing.
                </p>
                <motion.a
                  className="button button-gold"
                  href={`${WHATSAPP_LINK}?text=${encodeURIComponent(`Hello CLASPTEK, please share verified availability and pricing for ${selectedProperty.title} at Blue Stone Estate.`)}`}
                  animate={prefersReducedMotion ? undefined : 'shimmer'}
                  variants={goldShimmer}
                  whileHover={{ y: -2, boxShadow: '0 10px 20px rgba(212, 175, 55, 0.3)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Ask about this design <ArrowUpRight size={15} />
                </motion.a>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
