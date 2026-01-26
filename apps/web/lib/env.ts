import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  REDIS_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
})

type EnvConfig = z.infer<typeof envSchema>

let cachedEnv: EnvConfig | null = null

export function getEnvConfig(): EnvConfig {
  // Return cached config if available
  if (cachedEnv) {
    return cachedEnv
  }

  // Don't validate during build time - just return process.env as-is
  if (process.env.NEXT_PHASE === "phase-production-build") {
    console.log("[Env] Skipping validation during build")
    return process.env as unknown as EnvConfig
  }

  try {
    // Validate environment variables
    cachedEnv = envSchema.parse(process.env)
    return cachedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[Env] Environment validation failed:")
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`)
      })

      // Don't exit during build - just warn
      if (process.env.NODE_ENV === "production") {
        console.warn("[Env] Continuing with invalid environment in production")
        return process.env as unknown as EnvConfig
      }
    }

    throw error
  }
}

export function isEnvConfigured(): boolean {
  try {
    getEnvConfig()
    return true
  } catch {
    return false
  }
}

export function getEnv(key: keyof EnvConfig, fallback?: string): string {
  const config = getEnvConfig()
  return (config[key] as string) || fallback || ""
}
