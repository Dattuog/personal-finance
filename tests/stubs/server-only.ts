// Vitest does not run through Next.js's server module resolver. This no-op
// preserves the production import guard while allowing server-only modules to
// be exercised in the isolated Node.js integration-test environment.
export {};
