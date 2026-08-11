import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const serverActions = [
  "modules/accounts/actions.ts",
  "modules/insights/actions.ts",
  "modules/settings/actions.ts",
  "modules/transactions/actions.ts",
  "modules/users/onboarding-action.ts",
];

describe("private application boundaries", () => {
  it("requires authentication in the private layout", () => {
    const layout = readFileSync("app/(app)/layout.tsx", "utf8");
    expect(layout).toContain("await requireUser()");
  });

  it("derives identity inside every server action module", () => {
    for (const path of serverActions) {
      const source = readFileSync(path, "utf8");
      expect(source, path).toContain('"use server"');
      expect(source, path).toContain("await requireUser()");
      expect(source, path).not.toMatch(/formData\.get\(["']userId["']\)/u);
    }
  });

  it("does not expose environment values in application JSON routes", () => {
    const healthRoute = readFileSync("app/api/health/route.ts", "utf8");
    expect(healthRoute).not.toContain("process.env");
    expect(healthRoute).not.toContain("DATABASE_URL");
    expect(healthRoute).not.toContain("GEMINI_API_KEY");
  });
});
