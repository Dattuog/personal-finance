import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("request security policy", () => {
  it("sets a nonce-based CSP and disables private-page caching", () => {
    const response = proxy(
      new NextRequest("https://finance.example.com/insights"),
    );
    const policy = response.headers.get("content-security-policy") ?? "";
    expect(policy).toContain("default-src 'self'");
    expect(policy).toMatch(/script-src 'self' 'nonce-[^']+'/u);
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
