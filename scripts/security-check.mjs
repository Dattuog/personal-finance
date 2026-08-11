import { spawnSync } from "node:child_process";

const packageManagerScript = process.env.npm_execpath;
if (!packageManagerScript) {
  console.error("Run this check through pnpm: pnpm security:check");
  process.exit(1);
}

const checks = [
  ["security:secrets"],
  ["format:check"],
  ["lint"],
  ["typecheck"],
  ["test"],
  ["build"],
];

for (const [script] of checks) {
  const result = spawnSync(process.execPath, [packageManagerScript, script], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
