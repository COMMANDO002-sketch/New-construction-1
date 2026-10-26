import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { fadeUp, luxuryEase, staggerContainer } from '../animations.js'
import {
  APPROACH,
  COMPANY,
  CORE_SERVICES,
  SERVICE_CATEGORIES,
  VALUES,
} from '../site/content.js'
import SitePhoto from '../site/SitePhoto.jsx'
import { CtaBar, PageHero, SectionHeading, usePageTitle } from '../site/ui.jsx'
import houseSiteImage from '../assets/house-site-04.png'
import specialistSiteImage from '../assets/about-specialist-05.jpg'

export default function About() {
  const prefersReducedMotion = useReducedMotion()
  usePageTitle('About Us')

  return (
    <>
      <PageHero
        eyebrow="ABOUT US"
        heading="A construction company"
        accent="built on clear delivery."
        intro={`${COMPANY.legalName} provides building construction, renovation, project coordination, civil works and property marketing services. We deliver with qualified professionals, and engage specialist partners where a project requires it.`}
      >
        <Link className="button button-gold" to="/contact?intent=general">
          Talk to our team <ArrowUpRight size={15} />
        </Link>
        <Link className="button button-outline" to="/portfolio">
          View projects &amp; portfolio <ArrowUpRight size={15} />
        </Link>
      </PageHero>

      <section className="about-story section-pad">
        <div className="about-story-image">
          <img
            className="reveal-image"
            src={houseSiteImage}
            alt="Building works in progress on an active construction site"
            loading="lazy"
          />
        </div>
        <div className="about-story-copy">
          <p className="eyebrow"><span className="eyebrow-mark" />WHAT WE DO</p>
          <h2 className="display-heading reveal-heading">
            Building, renovating,
            <br />
            <em>coordinating, marketing.</em>
          </h2>
          <p className="reveal-copy">
            We are a construction and property company. Our work covers the full arc of a
            project — from planning and building through to the civil works around it and the
            marketing of the finished property.
          </p>
          <p className="reveal-copy">
            Most projects need more than one discipline. We coordinate the professionals,
            contractors and programmes involved so there is a single point of responsibility,
            and we bring in established specialist partners for drilling, treatment, metalwork,
            infrastructure and other specialist scopes.
          </p>
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

      <section className="about-services section-pad">
        <SectionHeading
          marker="01"
          eyebrow="OUR SERVICE AREAS"
          heading="Five things"
          accent="we do."
          note="Each area can be taken on its own or combined into a single coordinated project."
        />
        <motion.div
          className="about-core-grid"
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: '-80px' }}
        >
          {CORE_SERVICES.map(({ title, description }) => (
            <motion.article className="about-core-card" key={title} variants={fadeUp}>
              <h3>{title}</h3>
              <p>{description}</p>
            </motion.article>
          ))}
        </motion.div>
        <Link className="text-link about-services-link" to="/services">
          See the full services breakdown <ArrowUpRight size={14} />
        </Link>
      </section>

      <section className="about-approach section-pad">
        <SectionHeading
          marker="02"
          eyebrow="HOW WE WORK"
          heading="Qualified people,"
          accent="clearly coordinated."
          note="The disciplines below apply to every project we take on, regardless of size."
        />
        <div className="approach-grid approach-grid-wide">
          {APPROACH.map(({ title, description }, index) => (
            <motion.div
              className="approach-item"
              key={title}
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              whileInView="visible"
              variants={fadeUp}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: luxuryEase }}
            >
              <h3>{title}</h3>
              <p>{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="about-partners section-pad">
        <div className="about-partners-copy">
          <p className="eyebrow"><span className="eyebrow-mark" />SPECIALIST PARTNERS</p>
          <h2 className="display-heading reveal-heading">
            Knowing when to
            <br />
            <em>bring in specialists.</em>
          </h2>
          <p className="reveal-copy">
            Some scopes are better delivered by dedicated specialist firms. Where that is the
            case, we engage established partners and keep the coordination, communication and
            overall responsibility with us. Sector six of our services — industrial and
            specialised infrastructure — is delivered in this way.
          </p>
          <Link className="text-link" to="/services#industrial">
            See partner-led capabilities <ArrowUpRight size={14} />
          </Link>
        </div>
        <SitePhoto
          imageIndex={1}
          className="reveal-image"
          src={specialistSiteImage}
          alt="Roofing work underway on a residential construction site"
          caption="Roofing work at a residential construction site"
        />
      </section>

      <section className="about-categories section-pad">
        <SectionHeading
          marker="03"
          eyebrow="AT A GLANCE"
          heading="Everything we"
          accent="can help with."
          note="A summary of the six service categories. Full detail sits on the Construction Services page."
        />
        <div className="about-category-list">
          {SERVICE_CATEGORIES.map(({ id, title, items, status }) => (
            <Link className="about-category-row" key={id} to={`/services#${id}`}>
              <span className="about-category-title">
                {title}
                {status && <em className="status-chip">{status}</em>}
              </span>
              <span className="about-category-meta">{items.length} SERVICES</span>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </div>
      </section>

      <CtaBar
        title="See whether we are the right fit."
        note="Tell us about the project and we will let you know honestly how we can help."
      />

    </>
  )
}
