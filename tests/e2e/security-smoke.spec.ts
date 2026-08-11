import { expect, test } from "@playwright/test";

test("serves the public application without exposing private pages", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Know where your money went. Decide where it goes next.",
    }),
  ).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "Welcome back" }),
  ).toBeVisible();
});

test("returns a minimal health response", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: "ready" });
});
