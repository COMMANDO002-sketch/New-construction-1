import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, FileText } from 'lucide-react'
import { fadeUp, staggerContainer } from '../animations.js'
import { CTA, COMPANY, PORTFOLIO_CATEGORIES } from '../site/content.js'
import SitePhoto, { ImageNote } from '../site/SitePhoto.jsx'
import { CtaButton, CtaBar, PageHero, SectionHeading, usePageTitle } from '../site/ui.jsx'

export default function Portfolio() {
  const prefersReducedMotion = useReducedMotion()
  usePageTitle('Projects & Portfolio')

  return (
    <>
      <PageHero
        eyebrow="PROJECTS & PORTFOLIO"
        heading="An honest account"
        accent="of the work we do."
        intro="Rather than publish an unverified gallery, we set out the categories of project we undertake and share verified documentation directly with anyone who asks for it."
      >
        <a className="button button-gold" href="#portfolio-categories">
          Browse project categories <ArrowUpRight size={15} />
        </a>
        <CtaButton cta={CTA.quote} variant="outline" />
      </PageHero>

      <section className="portfolio-integrity section-pad">
        <div className="portfolio-integrity-inner">
          <span className="portfolio-integrity-icon"><FileText size={22} strokeWidth={1.4} /></span>
          <h2 className="reveal-heading">
            No invented projects.
            <br />
            <em>No borrowed photographs.</em>
          </h2>
          <p className="reveal-copy">
            {COMPANY.legalName} does not publish project records, client names, testimonials,
            certifications or professional registrations that have not been confirmed and
            verified. Photographs on this site are illustrative reference images — they are not
            presented as completed {COMPANY.shortName} projects.
          </p>
          <p className="reveal-copy">
            If you are evaluating us for a project, ask us directly. We will share relevant
            project documentation, scope records and references appropriate to the work you are
            planning.
          </p>
          <Link className="text-link" to="/contact?intent=general">
            Request project documentation <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      <section className="portfolio-categories section-pad" id="portfolio-categories">
        <SectionHeading
          marker="01"
          eyebrow="PROJECT CATEGORIES"
          heading="The kinds of"
          accent="projects we undertake."
          note="Each category below describes the work we carry out. Verified examples from that category are shared on request."
        />
        <motion.div
          className="portfolio-grid"
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: '-100px' }}
        >
          {PORTFOLIO_CATEGORIES.map(({ number, title, description, scope }, index) => (
            <motion.article className="portfolio-card" key={title} variants={fadeUp}>
              <SitePhoto
                imageIndex={index + 1}
                showCaption={false}
              />
              <div className="portfolio-card-top">
                <span className="portfolio-card-number">{number}</span>
                <span className="portfolio-card-tag">DOCUMENTATION ON REQUEST</span>
              </div>
              <h3>{title}</h3>
              <p className="portfolio-card-description">{description}</p>
              <ul className="portfolio-card-scope">
                {scope.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
              <Link className="text-link" to="/contact?intent=general">
                Request examples <ArrowUpRight size={14} />
              </Link>
            </motion.article>
          ))}
          <motion.article className="portfolio-card portfolio-card-action" variants={fadeUp}>
            <span className="portfolio-card-number">→</span>
            <h3>Planning something similar?</h3>
            <p className="portfolio-card-description">
              Tell us about the project and we will let you know whether we have relevant
              experience to show you, and how we would approach it.
            </p>
            <CtaButton cta={CTA.quote} shimmer />
          </motion.article>
        </motion.div>
      </section>

      <section className="portfolio-process section-pad">
        <SectionHeading
          marker="02"
          eyebrow="HOW PROJECTS RUN"
          heading="What working"
          accent="with us looks like."
          note="A consistent process across construction, civil works and property projects."
        />
        <div className="portfolio-steps">
          {[
            {
              title: 'Enquiry & brief',
              description: 'We establish what you need, the constraints and the intended outcome.',
            },
            {
              title: 'Assessment & pricing',
              description: 'Site information is reviewed and a written scope and price is issued.',
            },
            {
              title: 'Agreement',
              description: 'Scope, programme, payment schedule and responsibilities are confirmed in writing.',
            },
            {
              title: 'Delivery',
              description: 'Work is carried out by qualified professionals, with specialist partners where engaged.',
            },
            {
              title: 'Coordination & updates',
              description: 'You have a single point of contact and regular progress updates throughout.',
            },
            {
              title: 'Completion & handover',
              description: 'Snagging, final account and handover are completed and documented.',
            },
          ].map((step, index) => (
            <motion.div
              className="portfolio-step"
              key={step.title}
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              whileInView="visible"
              variants={fadeUp}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: index * 0.07 }}
            >
              <span>0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <ImageNote />

      <CtaBar
        title="Want to see relevant work?"
        note="Tell us the type of project and we will share documentation that is genuinely relevant to it."
      />
    </>
  )
}
