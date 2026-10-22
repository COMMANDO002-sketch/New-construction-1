import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { fadeUp, staggerContainer } from '../animations.js'
import { CTA, PROPERTY_TYPES, SERVICE_CATEGORIES } from '../site/content.js'
import SitePhoto, { ImageNote } from '../site/SitePhoto.jsx'
import { CheckList, CtaButton, CtaBar, PageHero, SectionHeading, usePageTitle } from '../site/ui.jsx'

const PROPERTY_SERVICES = SERVICE_CATEGORIES.find(({ id }) => id === 'real-estate')

export default function RealEstate() {
  usePageTitle('Real Estate & Property')

  return (
    <>
      <PageHero
        eyebrow="REAL ESTATE & PROPERTY"
        heading="Marketing, selling"
        accent="and letting property."
        intro="We act for property owners, buyers, tenants and investors — from listing and marketing through to letting, investment enquiries and development support."
      >
        <CtaButton cta={CTA.find} shimmer />
        <CtaButton cta={CTA.list} variant="outline" />
      </PageHero>

      <section className="re-services section-pad">
        <SectionHeading
          marker="01"
          eyebrow="PROPERTY SERVICES"
          heading="Four ways"
          accent="we can help."
          note="Each of these can be taken on its own. Owners often combine marketing with letting or development support."
        />
        <motion.div
          className="re-service-grid"
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: '-80px' }}
        >
          {PROPERTY_SERVICES.items.map(({ name, description }, index) => (
            <motion.article className="re-service-card" key={name} variants={fadeUp}>
              <span className="re-service-index">0{index + 1}</span>
              <h3>{name}</h3>
              <p>{description}</p>
              <Link
                className="text-link"
                to={
                  name.includes('Marketing') || name.includes('Leasing')
                    ? `/contact?intent=${CTA.list.intent}`
                    : `/contact?intent=${CTA.find.intent}`
                }
              >
                Enquire <ArrowUpRight size={14} />
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="re-types section-pad">
        <SectionHeading
          marker="02"
          eyebrow="WHAT WE MARKET"
          heading="Property types"
          accent="we handle."
          note="Illustrative categories only. Live listings, prices and availability are confirmed directly with our team."
        />
        <motion.div
          className="re-type-grid"
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: '-80px' }}
        >
          {PROPERTY_TYPES.map(({ number, title, description }, index) => (
            <motion.article className="re-type-card" key={title} variants={fadeUp}>
              <SitePhoto imageIndex={[0, 1, 3][index]} />
              <div className="re-type-body">
                <span className="re-type-index">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link className="text-link" to={`/contact?intent=${CTA.find.intent}`}>
                  Find a property <ArrowUpRight size={14} />
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
        <p className="re-listing-note">
          Interested in selling or letting a property in one of these categories?{' '}
          <Link to={`/contact?intent=${CTA.list.intent}`}>List a property with us</Link>.
        </p>
      </section>

      <section className="re-process section-pad">
        <div className="re-process-copy">
          <p className="eyebrow"><span className="eyebrow-mark" />HOW IT WORKS</p>
          <h2 className="display-heading reveal-heading">
            A straightforward
            <br />
            <em>way to transact.</em>
          </h2>
          <p className="reveal-copy">
            Property moves involve paperwork, verification and timing. We keep the process
            visible and confirm details in writing before any commitment is made.
          </p>
          <CheckList
            items={[
              'Requirement or property details confirmed in writing',
              'Verification and due diligence before commitment',
              'Viewings, offers and negotiations coordinated by our team',
              'Documentation and handover supported through to completion',
            ]}
          />
          <div className="re-process-actions">
            <CtaButton cta={CTA.find} />
            <CtaButton cta={CTA.list} variant="outline" />
          </div>
        </div>
        <SitePhoto imageIndex={2} className="reveal-image" />
      </section>

      <ImageNote />

      <CtaBar
        title="Buying, selling or letting?"
        note="Choose the option that matches your situation and we will pick it up from there."
      />

      <section className="re-investment section-pad">
        <div className="re-investment-inner">
          <p className="eyebrow"><span className="eyebrow-mark" />LAND &amp; INVESTMENT</p>
          <h2 className="reveal-heading">Land sales &amp; property investment enquiries</h2>
          <p className="reveal-copy">
            We support land purchases and property investment enquiries, including guidance on
            available options and coordination of the steps that follow. Nothing is presented as
            an investment recommendation — we provide information, and you decide.
          </p>
          <div className="re-investment-actions">
            <CtaButton cta={CTA.find} shimmer />
            <Link className="text-link" to="/contact?intent=general">
              Ask a question <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
