import { useEffect } from 'react'
import { Link, BrowserRouter, Route, Routes } from 'react-router-dom'
import { ReactLenis, useLenis } from 'lenis/react'
import { MotionConfig, useReducedMotion } from 'motion/react'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Services from './pages/Services.jsx'
import RealEstate from './pages/RealEstate.jsx'
import Portfolio from './pages/Portfolio.jsx'
import Contact from './pages/Contact.jsx'
import { AuthProvider } from './portal/auth.jsx'
import PortalRoutes from './portal/index.jsx'

function ScrollTriggerSync() {
  const lenis = useLenis()
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!lenis || prefersReducedMotion) return undefined

    let disposed = false
    let scrollTrigger

    import('gsap/ScrollTrigger').then((module) => {
      if (disposed) return
      scrollTrigger = module.ScrollTrigger
      lenis.on('scroll', scrollTrigger.update)
    })

    return () => {
      disposed = true
      if (scrollTrigger) lenis.off('scroll', scrollTrigger.update)
    }
  }, [lenis, prefersReducedMotion])

  return null
}

function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.4rem', margin: 0 }}>Page not found</h1>
        <p style={{ color: 'rgba(249,246,240,0.6)' }}>The page you are looking for does not exist.</p>
        <Link to="/" className="p-btn" style={{ textDecoration: 'none' }}>
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default function AppRoot() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <MotionConfig reducedMotion="user" transition={prefersReducedMotion ? { duration: 0.01 } : undefined}>
      <ReactLenis
        root
        options={{
          autoRaf: true,
          lerp: prefersReducedMotion ? 1 : 0.09,
          smoothWheel: !prefersReducedMotion,
        }}
      >
        <ScrollTriggerSync />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<App />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="services" element={<Services />} />
                <Route path="real-estate" element={<RealEstate />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="contact" element={<Contact />} />
              </Route>
              <Route path="/portal/*" element={<PortalRoutes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ReactLenis>
    </MotionConfig>
  )
}
