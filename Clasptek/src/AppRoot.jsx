import { useEffect } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import { MotionConfig, useReducedMotion } from 'motion/react'
import App from './App.jsx'

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
        <App />
      </ReactLenis>
    </MotionConfig>
  )
}
