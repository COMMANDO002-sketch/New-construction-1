import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { fadeUp, staggerContainer } from '../animations.js'
import { CTA, SERVICE_CATEGORIES } from '../site/content.js'
import SitePhoto from '../site/SitePhoto.jsx'
import { CtaButton, CtaBar, PageHero, usePageTitle } from '../site/ui.jsx'
import buildingProjectImage from '../assets/construction-services-06.png'
import landDevelopmentImage from '../assets/construction-services-08.png'
import boreholeProjectImage from '../assets/construction-services-10.png'
import civilWorksImage from '../assets/construction-services-09.png'
import industrialProjectImage from '../assets/construction-services-11.png'

/** Highlights the category matching the current hash, if any. */
function useActiveCategory() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const element = document.getElementById(hash.slice(1))
    if (!element) return
    element.classList.add('is-targeted')
    const timeout = window.setTimeout(() => element.classList.remove('is-targeted'), 2600)
    return () => window.clearTimeout(timeout)
  }, [hash])
}

export default function Services() {
  usePageTitle('Construction Services')
  useActiveCategory()

  return (
    <>
      <PageHero
        eyebrow="CONSTRUCTION SERVICES"
        heading="Six categories"
        accent="of work we take on."
        intro="Organised by discipline so you can find the right scope quickly. Each category can be engaged on its own or combined into a single coordinated project."
      />

      <nav className="service-jump section-pad" aria-label="Service categories">
        {SERVICE_CATEGORIES.map(({ id, title }) => (
          <a key={id} href={`#${id}`}>
            {title}
          </a>
        ))}
      </nav>

      {SERVICE_CATEGORIES.map(
        ({ id, title, summary, items, cta, secondaryCta, status }, index) => (
          <section className="service-block section-pad" id={id} key={id}>
            <div className="service-block-head">
              <h2 className="service-block-heading reveal-heading">
                {title}
                {status && <em className="status-chip">{status}</em>}
              </h2>
              <p className="service-block-summary reveal-copy">{summary}</p>
            </div>

            <div className="service-block-body">
              <motion.div
                className="service-item-grid"
                initial="hidden"
                whileInView="visible"
                variants={staggerContainer}
                viewport={{ once: true, margin: '-80px' }}
              >
                {items.map(({ name, description }) => (
                  <motion.article className="service-item" key={name} variants={fadeUp}>
                    <h3>{name}</h3>
                    <p>{description}</p>
                  </motion.article>
                ))}
              </motion.div>

              <aside className="service-block-aside">
                <SitePhoto
                  imageIndex={index + 1}
                  src={[
                    buildingProjectImage,
                    undefined,
                    landDevelopmentImage,
                    civilWorksImage,
                    boreholeProjectImage,
                    industrialProjectImage,
                  ][index]}
                  alt={
                    [
                      'Multi-unit residential construction in progress',
                      undefined,
                      'Land for sale beside residential construction in progress',
                      'Civil engineering works including road construction, drainage, bridges and port infrastructure',
                      'Borehole drilling equipment operating at a construction site',
                      'Completed residential development with landscaped grounds',
                    ][index]
                  }
                  caption={
                    [
                      'Residential building construction',
                      undefined,
                      'Land and residential development',
                      'Road, drainage, bridge and port infrastructure',
                      'Borehole drilling and water engineering',
                      'Residential development',
                    ][index]
                  }
                />
                <div className="service-block-cta">
                  <CtaButton cta={cta} shimmer={cta === CTA.quote} />
                  {secondaryCta && <CtaButton cta={secondaryCta} variant="outline" />}
                </div>
              </aside>
            </div>

            {status && (
              <p className="service-status-note">
                Work in this category is delivered together with established specialist partners.
                Enquire with us and we will confirm the right delivery route for your project.
              </p>
            )}
          </section>
        ),
      )}

      <CtaBar
        title="Not sure which service you need?"
        note="Describe the project and we will tell you the disciplines involved and how we would sequence them."
      />

      <section className="service-footer-note section-pad">
        <p>
          Scope for every project is agreed in writing before work begins. Prices, programmes
          and availability are confirmed per enquiry — nothing on this page is a fixed offer.
        </p>
        <Link className="text-link" to="/contact?intent=general">
          Ask us a question <ArrowUpRight size={14} />
        </Link>
      </section>
    </>
  )
}
