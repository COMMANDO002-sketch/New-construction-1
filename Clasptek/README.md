# Clasp Construction Company Limited

Public website for **Clasp Construction Company Limited** — building
construction, renovation, project coordination, civil works and property
marketing, delivered with qualified professionals and specialist partners
where appropriate.

Built with React, Vite, JavaScript, Tailwind CSS, Motion, GSAP and Lucide in a
responsive black-and-gold brand experience. The repository also still contains
the **estate portal** for tenants and the CDA: rent & bill payments
(Paystack), receipts, the CDA notice board with SMS push, complaints and admin
reports.

* Design & payment-flow documentation: [`docs/estate-portal.md`](docs/estate-portal.md)
* Backend setup guide: [`server/README.md`](server/README.md)

## Website

The public site is a six-page React Router application rendered inside a shared
layout (`src/App.jsx`) that provides the header, footer, WhatsApp float and
scroll handling.

| Route | Page | Source |
| --- | --- | --- |
| `/` | Home | `src/pages/Home.jsx` |
| `/about` | About Us | `src/pages/About.jsx` |
| `/services` | Construction Services | `src/pages/Services.jsx` |
| `/real-estate` | Real Estate & Property | `src/pages/RealEstate.jsx` |
| `/portfolio` | Projects & Portfolio | `src/pages/Portfolio.jsx` |
| `/contact` | Contact Us | `src/pages/Contact.jsx` |

* `src/site/content.js` — single source of truth for company details, the six
  navigation links, the five calls to action, the six service categories,
  portfolio categories and property types.
* `src/site/ui.jsx` — shared `PageHero`, `SectionHeading`, `CtaButton`,
  `CtaBar`, `CheckList` and `DocumentationNote` components.
* `src/site/PlaceholderImage.jsx` — labelled blueprint-style placeholder
  artwork used as a structural guide only.
* `src/site/useRevealMotion.js` — scroll reveals, re-initialised per route.
* `src/site/pages.css` — styles for the pages above, loaded after `App.css`.

### Content and compliance rules

* Core headline: "Building Spaces. Delivering Projects. Connecting Property
  Opportunities."
* Navigation is limited to the six pages listed above. The tenant portal is
  linked from the footer only.
* Service content is grouped into six categories, including a sixth
  *Industrial & Specialised Infrastructure* category that is explicitly
  presented as future / partner-led.
* All five calls to action — Request a Construction Quote, Discuss a
  Renovation Project, List a Property, Find a Property and Partner With Us —
  route to `/contact?intent=…`, which pre-selects the matching enquiry type in
  the form.
* No completed projects, testimonials, client names, certifications or
  professional registrations are asserted anywhere on the site. The Projects &
  Portfolio page sets out project categories and offers verified documentation
  on request instead.
* Images are either general site photographs or clearly labelled placeholder
  artwork. No generated image is presented as completed company work.

To change any copy, listing or service detail, edit `src/site/content.js`
rather than the page components.

## Estate portal

* `server/` — Node 20 + Express 5 + PostgreSQL API: JWT auth with roles
  (tenant / landlord / CDA admin / super admin), a unified rent & bill
  payment ledger, Paystack initialize/verify plus HMAC-signed webhooks,
  the CDA notice board with read receipts and Termii SMS push, complaints,
  and Excel report downloads (payments + defaulters). Verify with
  `npm run smoke` inside `server/`.
* `src/portal/` — React screens under `/portal`: login/register, dashboard
  with dues, Pay Rent / Pay Bills → Paystack checkout, printable receipts and
  payment history, notice board, complaints, and the CDA admin console
  (notices, payments, houses & tenants, bill pricing, defaulters, reports).

Run both terminals during development:

```powershell
# terminal 1 — API (first time: copy server\.env.example to server\.env and edit it)
npm --prefix .\server run db:migrate
npm --prefix .\server run seed
npm --prefix .\server run dev          # http://localhost:4000/api

# terminal 2 — site + portal
npm run dev                            # http://localhost:5173/portal
```

The frontend reads `VITE_API_URL` (see `.env.example`) and defaults to
`http://localhost:4000/api`.

## Run locally

From the parent `new constructio` directory, first enter the app folder:

```powershell
Set-Location .\Clasptek
npm run dev
```

Alternatively, run the app without changing directories:

```powershell
npm --prefix .\Clasptek run dev
```

From inside the `Clasptek` folder, install dependencies and start the app as
usual:

```sh
npm install
npm run dev
```

Create a production build with `npm run build` and run the project linter with
`npm run lint`.

## Motion

`src/animations.js` contains the shared Motion easing, reveal, card-hover and
button-shimmer variants. Lenis provides smooth scrolling and synchronizes scroll
updates with lazily loaded GSAP ScrollTrigger. GSAP is reserved for the
one-time homepage hero entrance, section reveals and reduced-motion-aware image
parallax. Users who prefer reduced motion get static content and non-smooth
scrolling.

## Contact and calls to action

Enquiries are handled without a backend. The contact form composes the visitor's
details into a WhatsApp message addressed to the company, and the same five
calls to action are surfaced on the home, services, real estate, portfolio and
contact pages. Phone, email, WhatsApp and location details appear in the footer
and contact page, with a floating WhatsApp button available on every page.

## Implementation status

The six-page public website and the estate portal (backend + tenant/admin UI)
are implemented and pass lint and the production build. Going live still
requires the external setup in [`docs/estate-portal.md`](docs/estate-portal.md)
§2 and §9 for the portal: a PostgreSQL database, a Paystack account (test keys
first, then live keys + webhook URL), and optionally a Termii SMS key for
receipts and notice push. Before launch, replace the placeholder artwork with
verified company photography and confirm the phone, email and WhatsApp details
in `src/site/content.js`. Backend credentials and personal data must only be
introduced with the corresponding secure services and environment
configuration — `.env` files are git-ignored and must never be committed.
