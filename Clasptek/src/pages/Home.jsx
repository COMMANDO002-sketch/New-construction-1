import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, ArrowUpRight, MapPin, Phone } from 'lucide-react'
import {
  cardHover,
  fadeUp,
  goldShimmer,
  luxuryEase,
  staggerContainer,
} from '../animations.js'
import { APPROACH, CTA, COMPANY, CORE_SERVICES, SERVICE_CATEGORIES, VALUES } from '../site/content.js'
import { ImageNote } from '../site/SitePhoto.jsx'
import {
  CheckList,
  CtaBar,
  DocumentationNote,
  SectionHeading,
  usePageTitle,
} from '../site/ui.jsx'
import heroImage from '../assets/hero-construction.png'
import houseSiteImage from '../assets/house-site-03.png'
import houseSiteImageTwo from '../assets/house-site-04.png'
import houseSiteImageThree from '../assets/house-site-05.png'
import propertyHomeImage from '../assets/property-home.png'
import SitePhoto from '../site/SitePhoto.jsx'

const HERO_SLIDES = [
  heroImage,
  houseSiteImage,
  houseSiteImageTwo,
  houseSiteImageThree,
  propertyHomeImage,
]

const HERO_SLIDE_DURATIONS = [5000, 5000, 5000, 5000, 10000]
const HERO_CROSSFADE_DURATION = 1400

const HERO_LINES = [
  'Building Spaces.',
  'Delivering Projects.',
  'Connecting Property',
  'Opportunities.',
]

/** Cinematic entrance for the homepage hero. */
function useHeroIntro() {
  const prefersReducedMotion = useReducedMotion()
  const heroRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion) return undefined

    let cancelled = false
    let context

    const initialize = async () => {
      const gsapModule = await import('gsap')
      if (cancelled || !heroRef.current) return

      const gsap = gsapModule.gsap
      gsap.registerPlugin((await import('gsap/ScrollTrigger')).ScrollTrigger)

      context = gsap.context(() => {
        gsap
          .timeline({ defaults: { ease: luxuryEase } })
          .fromTo('.hero-image-frame', { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 1.1 }, 0)
          .fromTo('.hero-reveal-line', { scaleX: 0 }, { scaleX: 1, duration: 0.8 }, 0)
          .fromTo('.wordmark-logo', { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.6 }, '-=0.35')
          .fromTo('.site-header-inner', { yPercent: -100 }, { yPercent: 0, duration: 0.8 }, 0.2)
          .fromTo('.hero-word', { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.08 }, '-=0.25')
          .fromTo('.hero-eyebrow', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 }, '<')
          .fromTo('.hero-description', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '+=0.1')
          .fromTo('.hero-actions .button', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1 }, '+=0.2')
          .fromTo('.hero-bottomline', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')

      }, heroRef)
    }

    initialize()
    return () => {
      cancelled = true
      context?.revert()
    }
  }, [prefersReducedMotion])

  return heroRef
}

export default function Home() {
  const prefersReducedMotion = useReducedMotion()
  const heroRef = useHeroIntro()
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [previousHeroSlide, setPreviousHeroSlide] = useState(null)

  useEffect(() => {
    if (prefersReducedMotion) return undefined

    const nextHeroSlide = (activeHeroSlide + 1) % HERO_SLIDES.length
    const imagePreloader = new window.Image()
    imagePreloader.decoding = 'async'
    imagePreloader.src = HERO_SLIDES[nextHeroSlide].image

    const timer = window.setTimeout(() => {
      setPreviousHeroSlide(activeHeroSlide)
      setActiveHeroSlide(nextHeroSlide)
    }, HERO_SLIDE_DURATIONS[activeHeroSlide])

    return () => window.clearTimeout(timer)
  }, [activeHeroSlide, prefersReducedMotion])

  usePageTitle('Building Spaces. Delivering Projects. Connecting Property Opportunities.')

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="hero-section" id="home" ref={heroRef}>
        <div className="hero-image-frame">
          {HERO_SLIDES.map((image, index) => {
            const isActive = index === activeHeroSlide
            const isPrevious = !prefersReducedMotion && index === previousHeroSlide

            if (!isActive && !isPrevious) return null

            return (
              <img
                key={image}
                className={`hero-image hero-slide-image ${isActive ? 'is-active' : 'is-previous'}`}
                src={image}
                alt=""
                aria-hidden="true"
                fetchPriority={index === 0 ? 'high' : undefined}
                decoding="async"
                style={{
                  '--hero-zoom-duration': `${HERO_SLIDE_DURATIONS[index] / 1000 + HERO_CROSSFADE_DURATION / 1000}s`,
                }}
                onTransitionEnd={(event) => {
                  if (event.propertyName === 'opacity' && isPrevious) {
                    setPreviousHeroSlide(null)
                  }
                }}
              />
            )
          })}
        </div>
        <div className="hero-shade" />
        <span className="hero-reveal-line" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              <span /> CONSTRUCTION · CIVIL WORKS · PROPERTY
            </p>
            <h1 className="hero-headline" aria-label={COMPANY.tagline}>
              {HERO_LINES.map((line, index) => (
                <span className="hero-word-mask" key={line}>
                  <span
                    className={`hero-word ${index === HERO_LINES.length - 1 ? 'hero-word-accent' : ''}`}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <p className="hero-description">
              {COMPANY.legalName} provides building construction, renovation, project
              coordination, civil works and property marketing services — delivered by qualified
              professionals, with specialist partners engaged where appropriate.
            </p>
            <div className="hero-actions">
              <motion.a
                className="button button-gold"
                href={`/contact?intent=${CTA.quote.intent}`}
                animate={prefersReducedMotion ? undefined : 'shimmer'}
                variants={goldShimmer}
                whileHover={prefersReducedMotion ? undefined : { y: -2, boxShadow: '0 10px 20px rgba(212, 175, 55, 0.3)' }}
                whileTap={{ scale: 0.97 }}
              >
                {CTA.quote.label} <ArrowRight size={16} />
              </motion.a>
              <motion.a
                className="button button-outline"
                href={`/contact?intent=${CTA.renovation.intent}`}
                whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                {CTA.renovation.label} <ArrowUpRight size={15} />
              </motion.a>
            </div>
          </div>
          <div className="hero-bottomline">
            <span>
              {COMPANY.legalName.toUpperCase()} <i /> {COMPANY.location.toUpperCase()}
            </span>
            <a href="#intro">
              <span className="scroll-mouse" aria-hidden="true"><i /></span>
              SCROLL TO EXPLORE <ArrowRight size={13} />
            </a>
          </div>
        </div>
        <span className="hero-image-note">ILLUSTRATIVE SITE PHOTOGRAPH</span>
      </section>

      {/* -------------------------------------------------------------- INTRO */}
      <section className="intro-section section-pad" id="intro">
        <div className="intro-kicker">
          <span className="eyebrow">WHO WE ARE</span>
          <span className="intro-rule reveal-divider" />
        </div>
        <div className="intro-content">
          <h2 className="display-heading reveal-heading">
            One partner across
            <br />
            <em>the whole project.</em>
          </h2>
          <div className="intro-copy reveal-copy">
            <p>
              {COMPANY.legalName} carries out building construction, renovation, project
              coordination, civil works and property marketing. We work with qualified
              professionals on our own team and bring in specialist partners where a project
              calls for it.
            </p>
            <Link className="text-link" to="/about">
              More about us <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
        <div className="core-service-row">
          {CORE_SERVICES.map(({ title, description }, index) => (
            <motion.div
              className="core-service-item"
              key={title}
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              whileInView="visible"
              variants={fadeUp}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: index * 0.08, ease: luxuryEase }}
            >
              <h3>{title}</h3>
              <p>{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- SERVICES */}
      <section className="home-services section-pad" id="services">
        <SectionHeading
          marker="01"
          eyebrow="CONSTRUCTION SERVICES"
          heading="Six service areas."
          accent="One point of contact."
          note="Structural building works through to specialist support and property services — organised so you always know who is responsible for what."
        />
        <motion.div
          className="home-service-grid"
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: '-100px' }}
        >
          {SERVICE_CATEGORIES.map(({ id, title, summary, items, status }) => (
            <motion.article className="home-service-card" key={id} variants={fadeUp} whileHover={cardHover}>
              <div className="home-service-topline">
                <span className="home-service-count">{items.length} SERVICES</span>
              </div>
              <h3>{title}</h3>
              {status && <span className="status-chip">{status}</span>}
              <p>{summary}</p>
              <Link className="text-link" to={`/services#${id}`}>
                View services <ArrowUpRight size={14} />
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* -------------------------------------------------------- REAL ESTATE */}
      <section className="home-property section-pad" id="property">
        <div className="home-property-copy">
          <p className="eyebrow"><span className="eyebrow-mark" />REAL ESTATE &amp; PROPERTY</p>
          <h2 className="display-heading reveal-heading">
            Property, marketed
            <br />
            <em>and managed.</em>
          </h2>
          <p className="home-property-intro reveal-copy">
            Alongside our construction work, we market and sell property, support land and
            investment enquiries, and handle letting and rental arrangements for owners.
          </p>
          <CheckList
            items={[
              'Property Marketing & Sales',
              'Property Development Support',
              'Land Sales & Property Investment Enquiries',
              'Property Leasing & Rentals',
            ]}
          />
          <div className="home-property-actions">
            <motion.a
              className="button button-gold"
              href={`/contact?intent=${CTA.find.intent}`}
              animate={prefersReducedMotion ? undefined : 'shimmer'}
              variants={goldShimmer}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              {CTA.find.label} <ArrowRight size={15} />
            </motion.a>
            <motion.a
              className="button button-outline"
              href={`/contact?intent=${CTA.list.intent}`}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              {CTA.list.label} <ArrowUpRight size={15} />
            </motion.a>
          </div>
          <Link className="text-link home-property-link" to="/real-estate">
            Explore real estate services <ArrowUpRight size={14} />
          </Link>
        </div>
        <SitePhoto imageIndex={3} className="home-property-image reveal-image" />
      </section>

      {/* ---------------------------------------------------------- PORTFOLIO */}
      <section className="home-portfolio section-pad" id="portfolio">
        <SectionHeading
          marker="02"
          eyebrow="PROJECTS & PORTFOLIO"
          heading="The record of"
          accent="our work."
          note="A clear, honest account of the kinds of projects we undertake. Verified project documentation is shared directly rather than published as marketing claims."
        />
        <div className="home-portfolio-body">
          <div className="home-portfolio-list">
            {[
              'Residential & commercial building',
              'Renovation, refurbishment & conversion',
              'Civil works & infrastructure',
              'Water engineering & specialist support',
            ].map((item, index) => (
              <motion.div
                className="home-portfolio-item"
                key={item}
                initial={prefersReducedMotion ? 'visible' : 'hidden'}
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: index * 0.08, ease: luxuryEase }}
              >
                <p>{item}</p>
              </motion.div>
            ))}
            <Link className="text-link" to="/portfolio">
              View projects &amp; portfolio <ArrowUpRight size={14} />
            </Link>
          </div>
          <DocumentationNote />
        </div>
      </section>

      {/* ---------------------------------------------------------- APPROACH */}
      <section className="home-approach" id="approach">
        <div className="home-approach-image">
          <img
            className="reveal-image"
            src={houseSiteImage}
            alt="Building works in progress on an active construction site"
            loading="lazy"
          />
          <span className="home-approach-label">
            ILLUSTRATIVE SITE PHOTOGRAPH <i /> {COMPANY.shortName.toUpperCase()}
          </span>
        </div>
        <div className="home-approach-copy">
          <p className="eyebrow"><span className="eyebrow-mark" />HOW WE WORK</p>
          <h2 className="display-heading reveal-heading">
            Qualified people.
            <br />
            <em>Clearly coordinated.</em>
          </h2>
          <p className="home-approach-intro reveal-copy">
            Projects move faster and cost less to correct when the right people are involved
            early and kept informed. That is the part of the job we take most seriously.
          </p>
          <div className="approach-grid">
            {APPROACH.map(({ title, description }) => (
              <div className="approach-item" key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <div className="values-row">
            {VALUES.map((value, index) => (
              <span key={value}>
                {index > 0 && <i />}
                {value.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </section>

      <CtaBar
        title="Tell us what you need."
        note="Choose the option that fits and we will come back to you with the right person and next steps."
      />

      <ImageNote />

      {/* ------------------------------------------------------------ CONTACT */}
      <section className="home-contact section-pad" id="contact">
        <div className="home-contact-heading">
          <p className="eyebrow"><span className="eyebrow-mark" />GET IN TOUCH</p>
          <h2 className="display-heading reveal-heading">
            Let&apos;s start
            <br />
            <em>the conversation.</em>
          </h2>
        </div>
        <div className="home-contact-details reveal-copy">
          <p>
            Planning a build, a renovation, a civil works package or a property move? Speak to
            the team directly.
          </p>
          <div className="contact-details">
            <a href={COMPANY.phoneLink}><Phone size={15} /> {COMPANY.phoneDisplay}</a>
            <a href={COMPANY.whatsapp} target="_blank" rel="noreferrer">
              <ArrowUpRight size={13} /> WhatsApp us
            </a>
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            <span><MapPin size={15} /> {COMPANY.location}</span>
          </div>
          <Link className="button button-outline home-contact-button" to="/contact">
            Contact us <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
    </>
  )
}
