import Stripe from "stripe";
import { MockStripe } from "./stripe-mock";

// CRITICAL: Lazy initialization to prevent side-effects during build
// This module should not execute heavy code during import

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

/**
 * Check if we're in build phase (Edge-safe, no process.argv)
 */
function isBuildPhase(): boolean {
  // CRITICAL: Use ONLY NEXT_PHASE env var - no process.argv (not available in Edge Runtime)
  return process.env.NEXT_PHASE === "phase-production-build" || 
         process.env.NEXT_PHASE === "phase-development-build" ||
         process.env.NEXT_PHASE === "phase-export";
}

// Lazy getter for Stripe instance (prevents initialization during build)
function getStripeInstance(): Stripe | MockStripe | null {
  // CRITICAL: Skip during build phase (Edge-safe check)
  if (isBuildPhase()) {
    // During build, return mock to prevent any initialization
    return new MockStripe() as any;
  }

  // Check if the key is a placeholder or invalid
  const isValidStripeKey = STRIPE_SECRET_KEY && 
    (STRIPE_SECRET_KEY.startsWith("sk_test_") || STRIPE_SECRET_KEY.startsWith("sk_live_")) && 
    !STRIPE_SECRET_KEY.includes("placeholder") &&
    !STRIPE_SECRET_KEY.includes("holder") &&
    !STRIPE_SECRET_KEY.includes("example") &&
    STRIPE_SECRET_KEY.length > 30;

  // In staging, only allow test keys
  // Note: NODE_ENV is typically "development" | "production" | "test", but we check for staging via other env vars
  const isStaging = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "preview";
  const isValidForStaging = !isStaging || (STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false);

  if (!STRIPE_SECRET_KEY) {
    console.warn("⚠️  STRIPE_SECRET_KEY is not set. Using mock Stripe for development.");
    return process.env.NODE_ENV === "development" ? new MockStripe() as any : null;
  } else if (!isValidStripeKey) {
    console.warn("⚠️  STRIPE_SECRET_KEY appears to be invalid or a placeholder.");
    console.warn("⚠️  Using mock Stripe for development. Get a valid key from: https://dashboard.stripe.com/test/apikeys");
    return process.env.NODE_ENV === "development" ? new MockStripe() as any : null;
  } else if (isStaging && !isValidForStaging) {
    console.error("❌ STAGING ERROR: STRIPE_SECRET_KEY must be a TEST key (sk_test_...) in staging!");
    console.error("   Current key starts with:", STRIPE_SECRET_KEY.substring(0, 8));
    console.error("   Get test keys from: https://dashboard.stripe.com/test/apikeys");
    throw new Error("Staging environment requires Stripe TEST keys only");
  }

  // Valid key - initialize Stripe
  try {
    return new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });
  } catch (error) {
    console.warn("⚠️  Failed to initialize Stripe. Using mock for development.");
    return process.env.NODE_ENV === "development" ? new MockStripe() as any : null;
  }
}

// Lazy export - only initialized when accessed
let stripeInstance: Stripe | MockStripe | null | undefined = undefined;

function getStripeLazy(): Stripe | MockStripe | null {
  if (stripeInstance === undefined) {
    stripeInstance = getStripeInstance();
  }
  return stripeInstance;
}

// Export getter function for lazy initialization
export const stripe = new Proxy({} as object, {
  get(_target, prop) {
    const instance = getStripeLazy();
    if (instance === null) {
      return undefined;
    }
    const value = (instance as any)[prop];
    // If it's a function, bind it to the instance
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
}) as Stripe | MockStripe | null;
