import { animate, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'

export const luxuryEase = [0.76, 0, 0.24, 1]

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: luxuryEase },
  },
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

export const cardHover = {
  y: -8,
  borderColor: '#D4AF37',
  boxShadow: '0 20px 40px rgba(212, 175, 55, 0.15)',
  transition: { duration: 0.4, ease: 'easeOut' },
}

export const goldShimmer = {
  shimmer: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 3, ease: 'linear', repeat: Infinity },
  },
}

export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const modalContent = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.98, y: 10, transition: { duration: 0.2 } },
}

export function useCountUp(value, duration = 1.5) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const prefersReducedMotion = useReducedMotion()
  const count = useMotionValue(0)
  const parts = String(value).match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/)
  const prefix = parts?.[1] ?? ''
  const target = Number(parts?.[2] ?? 0)
  const suffix = parts?.[3] ?? ''
  const formattedCount = useTransform(count, (current) =>
    `${prefix}${Math.round(current).toLocaleString('en-NG')}${suffix}`,
  )

  useEffect(() => {
    if (!isInView) return undefined
    if (prefersReducedMotion || target === 0) {
      count.set(target)
      return undefined
    }

    const controls = animate(count, target, { duration, ease: 'easeOut' })
    return () => controls.stop()
  }, [count, duration, isInView, prefersReducedMotion, target])

  return { formattedCount, ref }
}
