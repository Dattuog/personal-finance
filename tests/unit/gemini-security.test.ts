import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceExtensions = new Set([".ts", ".tsx"]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return sourceExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

describe("Gemini server boundary", () => {
  it("keeps the SDK, provider, and secret out of client components", () => {
    const clientSources = ["app", "components"]
      .flatMap(sourceFiles)
      .map((path) => ({ path, source: readFileSync(path, "utf8") }))
      .filter(({ source }) => /^\s*["']use client["'];/u.test(source));

    for (const { path, source } of clientSources) {
      expect(source, path).not.toContain("@google/genai");
      expect(source, path).not.toContain("providers/gemini-provider");
      expect(source, path).not.toContain("provider-factory");
      expect(source, path).not.toContain("GEMINI_API_KEY");
      expect(source, path).not.toContain("NEXT_PUBLIC_GEMINI");
    }
  });

  it("does not expose Gemini credentials from application routes", () => {
    for (const path of sourceFiles("app")) {
      const source = readFileSync(path, "utf8");
      expect(source, path).not.toContain("GEMINI_API_KEY");
      expect(source, path).not.toContain("@google/genai");
    }
  });
});
