import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, Check, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { COMPANY, ENQUIRY_TYPES } from '../site/content.js'
import { PageHero, usePageTitle } from '../site/ui.jsx'

const INTENT_MESSAGES = {
  quote: 'I would like to request a construction quote.',
  renovation: 'I would like to discuss a renovation project.',
  list: 'I would like to list a property with you.',
  find: 'I am looking for a property.',
  partner: 'I would like to discuss a partnership opportunity.',
  general: '',
}

function buildWhatsAppMessage(values) {
  const lines = [
    `Enquiry type: ${ENQUIRY_TYPES.find((t) => t.value === values.enquiryType)?.label ?? 'General Enquiry'}`,
    `Name: ${values.name}`,
    `Phone: ${values.phone || 'Not provided'}`,
    `Email: ${values.email || 'Not provided'}`,
  ]
  if (values.location) lines.push(`Location: ${values.location}`)
  lines.push('', values.message)
  return `Hello ${COMPANY.shortName},\n\n${lines.join('\n')}`
}

export default function Contact() {
  const prefersReducedMotion = useReducedMotion()
  const [searchParams] = useSearchParams()
  usePageTitle('Contact Us')

  const intent = searchParams.get('intent')
  const defaultType = useMemo(() => {
    const match = ENQUIRY_TYPES.find((type) => type.value === intent)
    return match ? match.value : 'general'
  }, [intent])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      location: '',
      enquiryType: defaultType,
      message: INTENT_MESSAGES[defaultType] ?? '',
    },
  })

  const onSubmit = (values) => {
    const url = `${COMPANY.whatsapp}?text=${encodeURIComponent(buildWhatsAppMessage(values))}`
    window.open(url, '_blank', 'noopener,noreferrer')
    reset()
  }

  return (
    <>
      <PageHero
        eyebrow="CONTACT US"
        heading="Tell us what"
        accent="you are planning."
        intro="Choose the option that matches your enquiry, fill in the form and we will come back to you. You can also reach us directly by phone, WhatsApp or email."
      />

      <section className="contact-main section-pad">
        <div className="contact-form-panel">
          <h2 className="contact-form-title">Send an enquiry</h2>
          <p className="contact-form-lead">
            Submitting opens WhatsApp with your details pre-filled so you can send it straight
            to our team.
          </p>

          <form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="field">
              <label htmlFor="contact-name">Full name *</label>
              <input
                id="contact-name"
                type="text"
                autoComplete="name"
                aria-invalid={errors.name ? 'true' : 'false'}
                {...register('name', { required: 'Please enter your name.' })}
              />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="contact-phone">Phone number</label>
                <input
                  id="contact-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+234"
                  {...register('phone')}
                />
              </div>
              <div className="field">
                <label htmlFor="contact-email">Email address</label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  {...register('email', {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address.',
                    },
                  })}
                />
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>
            </div>

            <div className="field">
              <label htmlFor="contact-location">Project or property location</label>
              <input id="contact-location" type="text" {...register('location')} />
            </div>

            <div className="field">
              <label htmlFor="contact-type">Enquiry type *</label>
              <select
                id="contact-type"
                {...register('enquiryType', { required: 'Please choose an enquiry type.' })}
              >
                {ENQUIRY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="contact-message">Your enquiry *</label>
              <textarea
                id="contact-message"
                rows="6"
                aria-invalid={errors.message ? 'true' : 'false'}
                {...register('message', {
                  required: 'Please tell us a little about your enquiry.',
                  minLength: {
                    value: 10,
                    message: 'Please add a little more detail so we can route your enquiry.',
                  },
                })}
              />
              {errors.message && <span className="field-error">{errors.message.message}</span>}
            </div>

            <button className="button button-gold contact-submit" type="submit">
              Send enquiry <ArrowUpRight size={15} />
            </button>

            {isSubmitSuccessful && (
              <p className="form-status" role="status">
                <Check size={15} /> Your enquiry has been prepared in WhatsApp. Press send to
                complete it.
              </p>
            )}

            <p className="contact-form-note">
              Prefer email? Write to us at{' '}
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> instead.
            </p>
          </form>
        </div>

        <aside className="contact-aside">
          <div className="contact-aside-block">
            <p className="eyebrow"><span className="eyebrow-mark" />REACH US DIRECTLY</p>
            <h2 className="reveal-heading">
              Prefer to
              <br />
              <em>just talk?</em>
            </h2>
            <div className="contact-direct-list">
              <a href={COMPANY.phoneLink}>
                <span><Phone size={16} /></span>
                <div>
                  <strong>Phone</strong>
                  {COMPANY.phoneDisplay}
                </div>
              </a>
              <a href={COMPANY.whatsapp} target="_blank" rel="noreferrer">
                <span><MessageCircle size={16} /></span>
                <div>
                  <strong>WhatsApp</strong>
                  Message us any time
                </div>
              </a>
              <a href={`mailto:${COMPANY.email}`}>
                <span><Mail size={16} /></span>
                <div>
                  <strong>Email</strong>
                  {COMPANY.email}
                </div>
              </a>
              <div className="contact-direct-item">
                <span><MapPin size={16} /></span>
                <div>
                  <strong>Location</strong>
                  {COMPANY.location}
                </div>
              </div>
            </div>
          </div>

          <div className="contact-aside-block contact-quick">
            <p className="eyebrow"><span className="eyebrow-mark" />QUICK ENQUIRY</p>
            <p>Jump straight to the right enquiry type.</p>
            <div className="contact-quick-links">
              {ENQUIRY_TYPES.map((type) => (
                <Link key={type.value} to={`/contact?intent=${type.value}`}>
                  {type.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="contact-assurance section-pad">
        <motion.div
          className="contact-assurance-inner"
          initial={prefersReducedMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="reveal-heading">What happens next</h2>
          <div className="contact-assurance-grid">
            {[
              {
                title: 'We read it properly',
                description: 'Your enquiry is reviewed by the person best placed to answer it.',
              },
              {
                title: 'We come back to you',
                description: 'You receive a direct response with next steps, not an automated reply.',
              },
              {
                title: 'Nothing is assumed',
                description: 'Scope, price and programme are confirmed in writing before any commitment.',
              },
            ].map((item) => (
              <div className="contact-assurance-item" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  )
}
