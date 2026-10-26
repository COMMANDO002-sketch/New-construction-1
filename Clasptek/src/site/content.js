export const COMPANY = {
  legalName: 'Clasp Construction Company Limited',
  shortName: 'Clasp Construction',
  brand: 'CLASPCONSTRUCTION',
  tagline: 'Building Spaces. Delivering Projects. Connecting Property Opportunities.',
  phoneDisplay: '+234 902 531 7736',
  phoneLink: 'tel:+2349025317736',
  whatsapp: 'https://wa.me/2349025317736',
  email: 'info@clasptek.com',
  location: 'Mowe-Ofada, Ogun State, Nigeria',
}

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Construction Services', to: '/services' },
  { label: 'Real Estate & Property', to: '/real-estate' },
  { label: 'Projects & Portfolio', to: '/portfolio' },
  { label: 'Contact Us', to: '/contact', accent: true },
]

/**
 * The five calls to action required across the site.
 * Each routes to the contact page with an `intent` query parameter so the
 * enquiry form can pre-select the correct enquiry type.
 */
export const CTA = {
  quote: {
    label: 'Request a Construction Quote',
    intent: 'quote',
    whatsapp:
      'Hello Clasp Construction Company Limited, I would like to request a construction quote.',
  },
  renovation: {
    label: 'Discuss a Renovation Project',
    intent: 'renovation',
    whatsapp:
      'Hello Clasp Construction Company Limited, I would like to discuss a renovation project.',
  },
  list: {
    label: 'List a Property',
    intent: 'list',
    whatsapp:
      'Hello Clasp Construction Company Limited, I would like to list a property with you.',
  },
  find: {
    label: 'Find a Property',
    intent: 'find',
    whatsapp:
      'Hello Clasp Construction Company Limited, I am looking for a property and would like to speak with your team.',
  },
  partner: {
    label: 'Partner With Us',
    intent: 'partner',
    whatsapp:
      'Hello Clasp Construction Company Limited, I would like to discuss a partnership opportunity.',
  },
}

export const CTA_ORDER = ['quote', 'renovation', 'list', 'find', 'partner']

export const ENQUIRY_TYPES = [
  { value: CTA.quote.intent, label: CTA.quote.label },
  { value: CTA.renovation.intent, label: CTA.renovation.label },
  { value: CTA.list.intent, label: CTA.list.label },
  { value: CTA.find.intent, label: CTA.find.label },
  { value: CTA.partner.intent, label: CTA.partner.label },
  { value: 'general', label: 'General Enquiry' },
]

/**
 * The six service categories. Category six is explicitly presented as a
 * future / partner-led capability rather than a directly delivered service.
 */
export const SERVICE_CATEGORIES = [
  {
    number: '01',
    id: 'building-construction',
    title: 'Building Construction & Project Management',
    summary:
      'From the first drawing to handover, we deliver residential and commercial building works and coordinate the people, programmes and approvals that keep a project moving.',
    items: [
      {
        name: 'Residential',
        description:
          'Houses, duplexes, bungalows and multi-unit residential builds, from foundation to finishing.',
      },
      {
        name: 'Commercial',
        description:
          'Offices, retail units, warehouses and mixed-use developments built for long-term use.',
      },
      {
        name: 'Structural Works',
        description:
          'Substructure, framing, roofing, slabs and structural alterations carried out to specification.',
      },
      {
        name: 'Building Planning & Design Coordination',
        description:
          'Coordinating designs, drawings, approvals and site information before work begins.',
      },
      {
        name: 'Construction Project Management',
        description:
          'Programme, cost, quality and contractor coordination across the full life of a build.',
      },
    ],
    cta: CTA.quote,
  },
  {
    number: '02',
    id: 'renovation',
    title: 'Renovation, Refurbishment & Conversion',
    summary:
      'We restore, upgrade and reconfigure existing buildings so they serve their owners better — often without the cost of building from scratch.',
    items: [
      {
        name: 'Building Renovation & Refurbishment',
        description:
          'Repair, upgrade and finishing of existing residential and commercial buildings.',
      },
      {
        name: 'Conversion and Adaptive Reuse',
        description:
          'Changing the use, layout or configuration of a building, including full gut-and-rebuild conversions.',
      },
    ],
    cta: CTA.renovation,
  },
  {
    number: '03',
    id: 'real-estate',
    title: 'Real Estate & Property Services',
    summary:
      'We help owners, buyers and investors move property forward — from marketing and sales through to leasing, development support and investment enquiries.',
    items: [
      {
        name: 'Property Marketing & Sales',
        description:
          'Listing, marketing and sale of residential, commercial and land property on behalf of owners.',
      },
      {
        name: 'Property Development Support',
        description:
          'Site identification, feasibility input and coordination support for development projects.',
      },
      {
        name: 'Land Sales & Property Investment Enquiries',
        description:
          'Guided support for land purchases and property investment opportunities.',
      },
      {
        name: 'Property Leasing & Rentals',
        description:
          'Letting and rental arrangements handled for property owners and prospective tenants.',
      },
    ],
    cta: CTA.find,
    secondaryCta: CTA.list,
  },
  {
    number: '04',
    id: 'civil',
    title: 'Civil Engineering & Infrastructure',
    summary:
      'We carry out civil works for private clients, developers and public-sector projects, working to agreed specification and applicable standards.',
    items: [
      {
        name: 'Road Construction & Maintenance',
        description:
          'New access roads, resurfacing, drainage integration and routine maintenance works.',
      },
      {
        name: 'Drainage & Sewage Systems',
        description:
          'Surface water drainage, soakaways, septic arrangements and sewage infrastructure.',
      },
      {
        name: 'Highways & Bridges',
        description:
          'Highway works and bridge construction, delivered alongside established specialist partners.',
      },
      {
        name: 'Waterways & Wharves',
        description:
          'Embankments, channels, shoreline protection and wharf-related civil works.',
      },
    ],
    cta: CTA.quote,
  },
  {
    number: '05',
    id: 'specialist',
    title: 'Water Engineering & Specialist Building Support',
    summary:
      'Specialist trades that keep a site supplied, safe and properly finished — available as standalone services or as part of a larger project.',
    items: [
      {
        name: 'Borehole Drilling',
        description:
          'Borehole survey, drilling, pump installation and yield testing for residential and commercial sites.',
      },
      {
        name: 'Water Treatment',
        description: 'Treatment, filtration and storage solutions for potable and process water.',
      },
      {
        name: 'Welding & Metalwork',
        description:
          'Structural steel, gates, balustrades, canopies and bespoke metal fabrication.',
      },
      {
        name: 'Landscaping & External Works',
        description:
          'Paving, external drainage, fencing, planting and general site finishing.',
      },
    ],
    cta: CTA.quote,
  },
  {
    number: '06',
    id: 'industrial',
    title: 'Industrial & Specialised Infrastructure',
    status: 'Future / Partner-Led',
    summary:
      'Larger specialist sectors we are building capability in. Work in these areas is delivered in partnership with established specialist firms.',
    items: [
      {
        name: 'Manufacturing Facilities',
        description:
          'Industrial buildings, production floors and supporting utilities and services.',
      },
      {
        name: 'Power Plant-Related Projects',
        description:
          'Civil and building works associated with power generation and distribution infrastructure.',
      },
      {
        name: 'Communications Infrastructure',
        description:
          'Towers, shelters, compound works and associated civils for communications networks.',
      },
    ],
    cta: CTA.partner,
  },
]

/**
 * Categories of work used on the Projects & Portfolio page.
 * No completed projects, clients, dates or locations are asserted here —
 * verified project documentation is provided on request instead.
 */
export const PORTFOLIO_CATEGORIES = [
  {
    number: '01',
    title: 'Residential Building',
    description:
      'New-build residential construction, including duplexes, bungalows and multi-unit schemes.',
    scope: ['New-build housing', 'Multi-unit residential', 'Structural & finishing works'],
  },
  {
    number: '02',
    title: 'Commercial Building',
    description:
      'Commercial and mixed-use building projects delivered to agreed programme and specification.',
    scope: ['Offices & retail', 'Warehousing', 'Mixed-use developments'],
  },
  {
    number: '03',
    title: 'Renovation & Conversion',
    description:
      'Refurbishment, upgrading and change-of-use works on existing buildings.',
    scope: ['Refurbishment', 'Adaptive reuse', 'Structural alterations'],
  },
  {
    number: '04',
    title: 'Civil Works & Infrastructure',
    description:
      'Roads, drainage, highways and waterway civils for private and public-sector clients.',
    scope: ['Roads & access', 'Drainage & sewage', 'Highways, bridges & waterways'],
  },
  {
    number: '05',
    title: 'Water & Specialist Support',
    description:
      'Borehole, water treatment, metalwork and external works delivered as standalone or integrated packages.',
    scope: ['Boreholes & treatment', 'Welding & metalwork', 'Landscaping & external works'],
  },
]

/**
 * Property categories marketed through the Real Estate & Property service.
 * These are service categories, not listings — no specific property, price,
 * location or availability is asserted.
 */
export const PROPERTY_TYPES = [
  {
    number: '01',
    title: 'Residential Property',
    description:
      'Duplexes, bungalows, apartments and family homes made available for sale or rent.',
  },
  {
    number: '02',
    title: 'Commercial Property',
    description:
      'Offices, retail units, warehouses and mixed-use space for owner-occupiers and investors.',
  },
  {
    number: '03',
    title: 'Land & Plots',
    description:
      'Residential and commercial land, with support through verification and purchase.',
  },
]

/** The five areas of service described in the company introduction. */
export const CORE_SERVICES = [
  {
    title: 'Building Construction',
    description: 'Residential and commercial building works from foundation through to handover.',
  },
  {
    title: 'Renovation',
    description: 'Refurbishment, upgrading and conversion of existing buildings.',
  },
  {
    title: 'Project Coordination',
    description:
      'Coordinating designs, professionals, contractors and programmes across a project.',
  },
  {
    title: 'Civil Works',
    description:
      'Roads, drainage, infrastructure and external works delivered to specification.',
  },
  {
    title: 'Property Marketing',
    description:
      'Marketing, sale, letting and investment support for property owners and buyers.',
  },
]

export const APPROACH = [
  {
    title: 'Qualified professionals',
    description:
      'Work is carried out by qualified professionals with the experience a given project requires.',
  },
  {
    title: 'Specialist partners',
    description:
      'Where a project calls for specialist capability, we engage established partner firms.',
  },
  {
    title: 'Clear coordination',
    description:
      'Designs, approvals, programme and cost are coordinated and kept visible throughout.',
  },
  {
    title: 'Straightforward communication',
    description:
      'One point of contact, regular updates and no ambiguity about what happens next.',
  },
]

export const VALUES = ['Quality', 'Integrity', 'Timely Delivery']
