/**
 * Script para auditar uso do PrismaClient no código
 * Verifica se há criação incorreta de novas instâncias
 * 
 * Usage: node scripts/audit-prisma-usage.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Auditing PrismaClient usage...\n");

// Diretórios para verificar (excluindo node_modules, .next, etc.)
const directoriesToCheck = [
  "app",
  "lib",
  "scripts",
  "prisma",
];

const filesToCheck = [];
const excludePatterns = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
];

function findFiles(dir, baseDir = "") {
  const fullPath = path.join(baseDir, dir);
  
  if (!fs.existsSync(fullPath)) {
    return;
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullEntryPath = path.join(fullPath, entry.name);
    const relativePath = path.relative(".", fullEntryPath);

    // Skip excluded patterns
    if (excludePatterns.some((pattern) => pattern.test(relativePath))) {
      continue;
    }

    if (entry.isDirectory()) {
      findFiles(entry.name, fullPath);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      filesToCheck.push(fullEntryPath);
    }
  }
}

// Find all files
directoriesToCheck.forEach((dir) => {
  findFiles(dir);
});

console.log(`📁 Found ${filesToCheck.length} files to check\n`);

// Patterns to find
const problematicPatterns = [
  {
    pattern: /new\s+PrismaClient\s*\(/g,
    description: "Direct PrismaClient instantiation (should use singleton)",
    severity: "ERROR",
  },
  {
    pattern: /const\s+\w+\s*=\s*new\s+PrismaClient/g,
    description: "New PrismaClient instance created",
    severity: "ERROR",
  },
  // Removed: Import warnings are false positives (importing types is OK)
];

const issues = [];

// Check each file
filesToCheck.forEach((filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    problematicPatterns.forEach(({ pattern, description, severity }) => {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        matches.forEach((match) => {
          const matchIndex = match.index;
          const lineNumber = content.substring(0, matchIndex).split("\n").length;
          const lineContent = lines[lineNumber - 1]?.trim() || "";

          // Skip if it's the singleton file itself (lib/prisma.ts) - this is the ONLY place that should create PrismaClient
          if (filePath.includes("lib/prisma.ts")) {
            return;
          }

          // Skip scripts (they can create their own instances - run in separate processes)
          // Scripts run in their own Node.js process, so they need their own PrismaClient
          if (filePath.includes("scripts/") || filePath.includes("prisma/seed")) {
            return;
          }

          // Skip test files (they can create their own instances)
          if (filePath.includes("tests/") || filePath.includes(".test.") || filePath.includes(".spec.")) {
            return;
          }

          // Skip if it's in a string literal (console.log, comments, etc.)
          if (lineContent.includes("console.log") && lineContent.includes("new PrismaClient")) {
            return; // It's just a message, not actual code
          }

          // Skip if it's in a comment
          const beforeMatch = content.substring(Math.max(0, matchIndex - 50), matchIndex);
          if (beforeMatch.includes("//") || beforeMatch.includes("/*") || beforeMatch.includes("*")) {
            // Check if comment is on same line
            const lineStart = content.lastIndexOf("\n", matchIndex) + 1;
            const lineBeforeMatch = content.substring(lineStart, matchIndex);
            if (lineBeforeMatch.includes("//") || lineBeforeMatch.includes("/*")) {
              return;
            }
          }

          // Skip if it's in a string (template literal, etc.)
          if (lineContent.includes("`") || lineContent.includes('"') || lineContent.includes("'")) {
            // Check if it's actually in a string
            const quotesBefore = (lineContent.substring(0, lineContent.indexOf(match[0]))).match(/["'`]/g);
            if (quotesBefore && quotesBefore.length % 2 !== 0) {
              return; // Inside a string
            }
          }

          // Skip if it's just importing types (not creating instance)
          if (lineContent.includes("import") && lineContent.includes("from") && !lineContent.includes("new PrismaClient")) {
            return;
          }

          // Skip if it's in a comment block
          if (lineContent.startsWith("//") || lineContent.startsWith("*") || lineContent.startsWith("/*")) {
            return;
          }

          issues.push({
            file: filePath,
            line: lineNumber,
            match: match[0],
            description,
            severity,
            lineContent,
          });
        });
      }
    });
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
  }
});

// Filter out scripts, seeds, tests, and the singleton file itself
const applicationIssues = issues.filter((issue) => {
  const file = issue.file.replace(/\\/g, "/"); // Normalize path separators
  return !file.includes("scripts/") && 
         !file.includes("prisma/seed") &&
         !file.includes("lib/prisma.ts") &&
         !file.includes("tests/") &&
         !file.includes(".test.") &&
         !file.includes(".spec.") &&
         !file.includes("node_modules") &&
         (file.startsWith("app/") || file.startsWith("lib/"));
});

// Report results
console.log("📊 Audit Results:\n");

if (applicationIssues.length === 0) {
  console.log("✅ No issues found in application code! All Prisma usage looks correct.\n");
  console.log(`ℹ️  Note: ${issues.length - applicationIssues.length} instance(s) found in scripts/seeds (this is OK)\n`);
} else {
  const errors = applicationIssues.filter((i) => i.severity === "ERROR");
  const warnings = applicationIssues.filter((i) => i.severity === "WARN");

  if (errors.length > 0) {
    console.log(`❌ Found ${errors.length} ERROR(s) in application code:\n`);
    errors.forEach((issue) => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   ${issue.description}`);
      console.log(`   ${issue.lineContent}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} WARNING(s):\n`);
    warnings.forEach((issue) => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   ${issue.description}`);
      console.log(`   ${issue.lineContent}\n`);
    });
  }

  console.log("\n💡 Recommendations:");
  console.log("   - Always import prisma from '@/lib/prisma'");
  console.log("   - Never create 'new PrismaClient()' in application code");
  console.log("   - Scripts can create their own instances (they run in separate processes)");
  
  if (issues.length - applicationIssues.length > 0) {
    console.log(`\nℹ️  ${issues.length - applicationIssues.length} instance(s) found in scripts/seeds (this is OK)`);
  }
}

// Check if singleton is being imported correctly
console.log("\n✅ Checking singleton usage...\n");

const importPattern = /from\s+["']@\/lib\/prisma["']|from\s+["']\.\.\/lib\/prisma["']/g;
const correctImports = [];

filesToCheck.forEach((filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    if (importPattern.test(content) && !filePath.includes("lib/prisma.ts")) {
      correctImports.push(filePath);
    }
  } catch (error) {
    // Ignore
  }
});

console.log(`✅ Found ${correctImports.length} file(s) using singleton import:`);
correctImports.slice(0, 10).forEach((file) => {
  console.log(`   - ${file}`);
});
if (correctImports.length > 10) {
  console.log(`   ... and ${correctImports.length - 10} more`);
}

console.log("\n✅ Audit completed!\n");

// Only fail if there are issues in application code (not scripts)
if (applicationIssues.length > 0) {
  console.log("❌ Please fix the issues above before deploying.\n");
  process.exit(1);
} else {
  console.log("✅ Application code is clean! Ready for serverless deployment.\n");
  console.log(`ℹ️  ${issues.length} instance(s) found in scripts/seeds (this is expected and OK)\n`);
}

