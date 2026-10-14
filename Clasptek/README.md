# CLASPTEK — Build. House. Manage.

The CLASPTEK public website is built with React, Vite, JavaScript, Tailwind CSS,
Motion, GSAP and Lucide. The initial release establishes the responsive
black-and-gold brand experience and public homepage for Blue Stone Estate,
Mowe-Ofada, Ogun State.

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

`src/animations.js` contains the shared Motion easing, reveal, card-hover,
button-shimmer and modal variants, together with the `useCountUp` hook used by
the public trust metrics. Lenis provides smooth scrolling and synchronizes
scroll updates with lazily loaded GSAP ScrollTrigger. GSAP is reserved for the
one-time hero entrance, section reveals and reduced-motion-aware image
parallax. Users who prefer reduced motion get static content and non-smooth
scrolling. The property-design modal uses a shared image layout transition;
its concepts remain illustrative and are not verified inventory.

## Homepage

The homepage includes the company introduction and supplied business
credentials, home-design cards, client-side home-type filters, locally stored
favourite state for the current page session, Blue Stone benefits, service
summaries, and direct phone, email and WhatsApp contact links. Home images are
illustrative placeholders, marked in the source for replacement with approved
Blue Stone photography. Home cards are design concepts, not verified live
listings; prices and availability are not represented as confirmed.

## Implementation status

This release is a public-site foundation, not the complete real-estate
management platform. Property search is not connected to a database, and there
is no backend, authentication, tenant/owner data, Paystack payment processing,
inspection booking, 3D tour, or operational dashboard yet. Do not use the
illustrative home cards as inventory or availability data. Backend credentials
and personal data must only be introduced with the corresponding secure
services and environment configuration.
