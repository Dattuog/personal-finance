import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/components/**/*.test.tsx"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      reporter: ["text", "html"],
      include: ["modules/**/*.ts", "lib/**/*.ts"],
    },
  },
});
