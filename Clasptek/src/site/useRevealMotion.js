import { useEffect } from 'react'
import { useReducedMotion } from 'motion/react'
import { luxuryEase } from '../animations.js'

/**
 * Runs the cinematic scroll reveals used across the site.
 *
 * Called with the current route key so reveals re-initialise whenever the
 * visitor navigates to a different page. Every tween is scoped to a gsap
 * context so it is fully reverted on unmount, and the whole effect is skipped
 * when the visitor prefers reduced motion (the elements are visible by
 * default in CSS, so nothing is hidden in that case).
 */
export function useRevealMotion(routeKey) {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return undefined

    let cancelled = false
    let context
    let stopPerformanceMonitor

    const initializeMotion = async () => {
      const [gsapModule, scrollTriggerModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return

      const gsap = gsapModule.gsap
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger
      gsap.registerPlugin(ScrollTrigger)
      ScrollTrigger.config({ limitCallbacks: true })

      const parallaxTweens = []
      let lastFrameTime = performance.now()
      let slowFrameCount = 0
      const isLowPowerDevice =
        window.matchMedia('(max-width: 700px)').matches ||
        (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)

      const monitorPerformance = () => {
        const now = performance.now()
        slowFrameCount = now - lastFrameTime > 1000 / 45 ? slowFrameCount + 1 : 0
        lastFrameTime = now

        if (slowFrameCount >= 12) {
          parallaxTweens.forEach((tween) => {
            tween.scrollTrigger?.kill()
            tween.kill()
          })
          gsap.ticker.remove(monitorPerformance)
        }
      }

      context = gsap.context(() => {
        gsap.utils.toArray('.reveal-heading').forEach((element) => {
          gsap.fromTo(
            element,
            { clipPath: 'inset(0 100% 0 0)' },
            {
              clipPath: 'inset(0 0% 0 0)',
              duration: 1,
              ease: luxuryEase,
              scrollTrigger: { trigger: element, start: 'top 85%', once: true },
            },
          )
        })

        gsap.utils.toArray('.reveal-copy').forEach((element) => {
          gsap.fromTo(
            element,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: luxuryEase,
              scrollTrigger: { trigger: element, start: 'top 90%', once: true },
            },
          )
        })

        gsap.utils.toArray('.reveal-divider').forEach((element) => {
          gsap.fromTo(
            element,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.8,
              ease: luxuryEase,
              transformOrigin: 'left center',
              scrollTrigger: { trigger: element, start: 'top 92%', once: true },
            },
          )
        })

        gsap.utils.toArray('.reveal-image').forEach((element) => {
          gsap.fromTo(
            element,
            { scale: 1.12, clipPath: 'inset(8% 0 8% 0)' },
            {
              scale: 1,
              clipPath: 'inset(0 0 0 0)',
              duration: 1.2,
              ease: luxuryEase,
              scrollTrigger: { trigger: element, start: 'top 92%', once: true },
            },
          )

          if (!isLowPowerDevice) {
            const parallaxTween = gsap.fromTo(
              element,
              { yPercent: -4 },
              {
                yPercent: 4,
                ease: 'none',
                scrollTrigger: {
                  trigger: element,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            )
            parallaxTweens.push(parallaxTween)
          }
        })

        if (parallaxTweens.length) {
          gsap.ticker.add(monitorPerformance)
          stopPerformanceMonitor = () => gsap.ticker.remove(monitorPerformance)
        }

        ScrollTrigger.refresh()
      }, document.body)
    }

    initializeMotion()
    return () => {
      cancelled = true
      stopPerformanceMonitor?.()
      context?.revert()
    }
  }, [prefersReducedMotion, routeKey])
}
