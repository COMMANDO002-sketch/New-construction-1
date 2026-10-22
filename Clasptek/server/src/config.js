import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PGSSL: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  APP_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  PAYSTACK_SECRET_KEY: z.string().default(''),
  PAYSTACK_PUBLIC_KEY: z.string().default(''),
  TERMII_API_KEY: z.string().default(''),
  TERMII_SENDER_ID: z.string().default('CLASPTEK'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  console.error(`Invalid environment configuration:\n${details}`)
  process.exit(1)
}

export const env = parsed.data

export const paystackConfigured = () => env.PAYSTACK_SECRET_KEY.length > 0
export const paystackIsLive = () => env.PAYSTACK_SECRET_KEY.startsWith('sk_live_')
export const smsConfigured = () => env.TERMII_API_KEY.length > 0
