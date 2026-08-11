import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  "app/generated",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
  "tmp",
  "uploads",
]);
const ignoredFiles = new Set([".env", ".env.local"]);
const binaryExtensions = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".webp",
  ".woff",
  ".woff2",
]);
const placeholderPattern =
  /(?:^$|^password$|placeholder|replace[-_ ]?with|your[_-]|example|dummy|ci[-_ ]|build[-_ ]|process\.env|\$\{|<[^>]+>|USER:PASSWORD)/i;
const highConfidencePatterns = [
  ["Gemini API key", /AIza[0-9A-Za-z_-]{20,}/g],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["GitHub token", /gh[opusr]_[0-9A-Za-z]{30,}/g],
  ["AWS access key", /AKIA[0-9A-Z]{16}/g],
  ["Slack token", /xox[baprs]-[0-9A-Za-z-]{20,}/g],
];

function fallbackFiles(directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    const projectPath = relative(root, absolute).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      if (
        [...ignoredDirectories].some(
          (ignored) =>
            projectPath === ignored || projectPath.startsWith(`${ignored}/`),
        )
      )
        return [];
      return fallbackFiles(absolute);
    }
    if (
      ignoredFiles.has(projectPath) ||
      /^\.env\.(?!example$)/u.test(projectPath) ||
      binaryExtensions.has(extname(entry.name).toLocaleLowerCase())
    )
      return [];
    return [projectPath];
  });
}

function repositoryFiles() {
  const tracked = spawnSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
  });
  if (tracked.status === 0 && tracked.stdout) {
    return tracked.stdout.split("\u0000").filter(Boolean);
  }
  return fallbackFiles();
}

const files = repositoryFiles();
const findings = [];
for (const file of files) {
  let source;
  try {
    source = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }
  const lines = source.split(/\r?\n/u);
  lines.forEach((line, index) => {
    for (const [rule, pattern] of highConfidencePatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) findings.push({ file, line: index + 1, rule });
    }

    const databaseUrl = line.match(
      /postgres(?:ql)?:\/\/[^\s:"']+:([^\s@"']+)@/iu,
    );
    if (databaseUrl?.[1] && !placeholderPattern.test(databaseUrl[1])) {
      findings.push({ file, line: index + 1, rule: "database credential" });
    }

    const assignedSecret = line.match(
      /^\s*(?:ENV\s+)?(GEMINI_API_KEY|AUTH_SECRET|NEXTAUTH_SECRET|DATABASE_URL|PRIVATE_KEY|ACCESS_KEY|REDIS_TOKEN)\s*[:=]\s*["']?([^"'#\s]+)?/u,
    );
    if (
      assignedSecret?.[2] &&
      assignedSecret[1] !== "DATABASE_URL" &&
      !file.startsWith("tests/") &&
      !placeholderPattern.test(assignedSecret[2]) &&
      !assignedSecret[2].startsWith("z.") &&
      !assignedSecret[2].startsWith("$(")
    ) {
      findings.push({
        file,
        line: index + 1,
        rule: "literal secret assignment",
      });
    }
  });
}

const gitignore = readFileSync(join(root, ".gitignore"), "utf8");
if (!/^\.env$/mu.test(gitignore)) {
  findings.push({ file: ".gitignore", line: 1, rule: ".env is not ignored" });
}

if (findings.length) {
  console.error("Potential secrets detected (values intentionally hidden):");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} (${finding.rule})`);
  }
  process.exit(1);
}

console.log(`Secret scan passed for ${files.length} repository files.`);
