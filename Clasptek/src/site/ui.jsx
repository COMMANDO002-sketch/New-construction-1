import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { CTA, CTA_ORDER, COMPANY } from './content.js'
import { goldShimmer, staggerContainer, fadeUp } from '../animations.js'

/** Sets the document title for the current page. */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} — ${COMPANY.shortName}`
  }, [title])
}

/** Consistent page header for every route except the homepage hero. */
export function PageHero({ eyebrow, heading, accent, intro, children }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="page-hero">
      <div className="page-hero-inner section-pad">
        <p className="eyebrow"><span className="eyebrow-mark" />{eyebrow}</p>
        <h1 className="display-heading reveal-heading">
          {heading}
          {accent && <><br /><em>{accent}</em></>}
        </h1>
        {intro && <p className="page-hero-intro reveal-copy">{intro}</p>}
        {children && (
          <motion.div
            className="page-hero-actions"
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            animate="visible"
            variants={staggerContainer}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  )
}

const MotionLink = motion.create(Link)

/** A single call-to-action button, linking to the contact page with an intent. */
export function CtaButton({ cta, variant = 'gold', className = '', shimmer = false }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <MotionLink
      className={`button button-${variant} ${className}`.trim()}
      to={`/contact?intent=${cta.intent}`}
      animate={shimmer && !prefersReducedMotion ? 'shimmer' : undefined}
      variants={shimmer ? goldShimmer : undefined}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      {cta.label}
      <ArrowUpRight size={15} />
    </MotionLink>
  )
}

/**
 * The full set of five calls to action, used on the homepage, the service
 * pages and the contact page.
 */
export function CtaBar({ title, note, columns = false }) {
  return (
    <section className="cta-band section-pad">
      <div className="cta-band-head">
        <p className="eyebrow"><span className="eyebrow-mark" />HOW CAN WE HELP?</p>
        <h2 className="display-heading reveal-heading">{title}</h2>
        {note && <p className="cta-band-note reveal-copy">{note}</p>}
      </div>
      <motion.div
        className={`cta-grid ${columns ? 'cta-grid-wide' : ''}`.trim()}
        initial="hidden"
        whileInView="visible"
        variants={staggerContainer}
        viewport={{ once: true, margin: '-80px' }}
      >
        {CTA_ORDER.map((key, index) => (
          <motion.div key={key} variants={fadeUp}>
            <CtaButton
              cta={CTA[key]}
              variant={index === 0 ? 'gold' : 'outline'}
              shimmer={index === 0}
              className="cta-grid-button"
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

/** Standard section heading block. */
export function SectionHeading({ marker, eyebrow, heading, accent, note }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">
          {marker && <span className="eyebrow-mark">{marker}</span>}
          {eyebrow}
        </p>
        <h2 className="display-heading reveal-heading">
          {heading}
          {accent && <><br /><em>{accent}</em></>}
        </h2>
      </div>
      {note && <p className="section-heading-note reveal-copy">{note}</p>}
    </div>
  )
}

/** Short list of items with gold check marks. */
export function CheckList({ items }) {
  return (
    <ul className="check-list">
      {items.map((item) => (
        <li key={item}>
          <Check size={14} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** A quiet, honest note about how project documentation is shared. */
export function DocumentationNote() {
  return (
    <div className="doc-note">
      <h3>Project documentation on request</h3>
      <p>
        Verified project photographs, scope records, client references and completion
        documentation for {COMPANY.legalName} are shared directly on request. We do not publish
        project records, client names, testimonials or certifications that have not been confirmed
        and verified.
      </p>
      <Link className="text-link" to="/contact?intent=general">
        Request project documentation <ArrowRight size={14} />
      </Link>
    </div>
  )
}
