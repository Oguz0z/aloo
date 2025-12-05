#!/usr/bin/env npx tsx
/**
 * ALOO Security Audit Script
 * Run before publishing: npx tsx scripts/security-audit.ts
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const ISSUES: { severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; file: string; line?: number; issue: string }[] = [];

// Colors for terminal
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function addIssue(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', file: string, issue: string, line?: number) {
  ISSUES.push({ severity, file, line, issue });
}

function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) return files;

  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);

    // Skip node_modules, .next, .git, generated
    if (item === 'node_modules' || item === '.next' || item === '.git' || item === 'generated') continue;

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkFile(filePath: string, content: string, lines: string[]) {
  const relPath = relative(ROOT, filePath);

  // 1. Check for hardcoded secrets
  const secretPatterns = [
    { pattern: /['"]sk-[a-zA-Z0-9]{20,}['"]/, name: 'OpenAI API Key' },
    { pattern: /['"]AIza[a-zA-Z0-9_-]{35}['"]/, name: 'Google API Key' },
    { pattern: /['"][a-f0-9]{32}['"](?=.*rapid)/i, name: 'RapidAPI Key' },
    { pattern: /password\s*[:=]\s*['"][^'"]{8,}['"](?!.*process\.env)/i, name: 'Hardcoded Password' },
    { pattern: /secret\s*[:=]\s*['"][^'"]{16,}['"](?!.*process\.env)/i, name: 'Hardcoded Secret' },
  ];

  for (const { pattern, name } of secretPatterns) {
    lines.forEach((line, idx) => {
      if (pattern.test(line) && !line.includes('example') && !line.includes('placeholder')) {
        addIssue('CRITICAL', relPath, `Possible ${name} found`, idx + 1);
      }
    });
  }

  // 2. Check for SQL injection patterns (non-parameterized queries)
  if (content.includes('prisma')) {
    lines.forEach((line, idx) => {
      // Check for string interpolation in prisma queries
      if (line.includes('$raw') || line.includes('$queryRaw')) {
        if (line.includes('${') || line.includes("'+") || line.includes("' +")) {
          addIssue('CRITICAL', relPath, 'Possible SQL injection in raw query', idx + 1);
        }
      }
    });
  }

  // 3. Check for missing auth in API routes
  if (filePath.includes('/api/') && filePath.endsWith('route.ts')) {
    const hasAuth = content.includes('await auth()') ||
                   content.includes('requireUserId') ||
                   content.includes('requireValidUser') ||
                   content.includes('getServerSession');

    // Skip health endpoint, auth endpoints (they handle their own auth), admin (uses bearer token)
    const isAuthRoute = filePath.includes('/auth/') || filePath.includes('/admin/');
    if (!filePath.includes('/health/') && !isAuthRoute && !hasAuth) {
      addIssue('HIGH', relPath, 'API route may be missing authentication check');
    }

    // Check for userId in database queries
    if (content.includes('prisma.') && !content.includes('/health/')) {
      const hasFindMany = content.includes('.findMany(');
      const hasFindFirst = content.includes('.findFirst(');
      const hasDelete = content.includes('.delete(') || content.includes('.deleteMany(');
      const hasUpdate = content.includes('.update(') || content.includes('.updateMany(');

      if ((hasFindMany || hasFindFirst || hasDelete || hasUpdate)) {
        // Check if userId is used anywhere (could be in separate ownership check)
        const hasUserIdCheck = content.includes('userId') &&
          (content.includes('session.user.id') || content.includes('userId:'));

        // Also check for ownership verification pattern (find then check userId)
        const hasOwnershipCheck = content.includes('.userId !== session.user.id') ||
                                  content.includes('.userId === session.user.id') ||
                                  content.includes('userId: session.user.id') ||
                                  content.includes('requireUserId') ||
                                  content.includes('requireValidUser');

        // Auth endpoints use token-based auth, not userId
        const isTokenBasedAuth = filePath.includes('/auth/') && content.includes('Token');

        if (!hasUserIdCheck && !hasOwnershipCheck && !isTokenBasedAuth && !filePath.includes('/admin/')) {
          addIssue('HIGH', relPath, 'Database query may be missing userId authorization check');
        }
      }
    }
  }

  // 4. Check for dangerous patterns
  lines.forEach((line, idx) => {
    // eval() usage
    if (/\beval\s*\(/.test(line)) {
      addIssue('CRITICAL', relPath, 'eval() usage detected - code injection risk', idx + 1);
    }

    // dangerouslySetInnerHTML
    if (line.includes('dangerouslySetInnerHTML')) {
      addIssue('HIGH', relPath, 'dangerouslySetInnerHTML usage - potential XSS', idx + 1);
    }

    // Unvalidated redirects (skip auth config which uses callbacks safely)
    if (/redirect\s*\(\s*[^'"\/]/.test(line) &&
        !line.includes('callbackUrl') &&
        !filePath.includes('auth.config') &&
        !filePath.includes('auth.ts')) {
      addIssue('MEDIUM', relPath, 'Possible open redirect vulnerability', idx + 1);
    }

    // Console.log with sensitive data
    if (/console\.(log|info)\s*\([^)]*(?:password|secret|token|key|apiKey)/i.test(line)) {
      addIssue('HIGH', relPath, 'Logging potentially sensitive data', idx + 1);
    }
  });

  // 5. Check for unsafe JSON parsing
  if (filePath.includes('/api/') && content.includes('request.json()')) {
    if (!content.includes('parseRequestBody') && !content.includes('try')) {
      // Check if the request.json() is inside a try block
      const jsonCallIndex = content.indexOf('request.json()');
      const beforeJson = content.substring(0, jsonCallIndex);
      const lastTry = beforeJson.lastIndexOf('try');
      const lastCatch = beforeJson.lastIndexOf('catch');

      if (lastTry === -1 || lastCatch > lastTry) {
        addIssue('MEDIUM', relPath, 'request.json() without try-catch or parseRequestBody');
      }
    }
  }

  // 6. Check for unvalidated user input in database operations
  if (content.includes('searchParams.get(')) {
    // Check if there's whitelist validation for sortBy
    const hasSortValidation = content.includes('ALLOWED_SORT_FIELDS') ||
                               content.includes('allowedSortFields') ||
                               content.includes('.includes(sortBy)') ||
                               content.includes('.includes(requestedSortBy)');

    if (!hasSortValidation) {
      lines.forEach((line, idx) => {
        // Check for dynamic orderBy usage
        if (line.includes('orderBy') && line.includes('[') && line.includes('sortBy')) {
          addIssue('HIGH', relPath, 'Possible injection via orderBy parameter - add whitelist validation', idx + 1);
        }
      });
    }
  }
}

function checkEnvFiles() {
  // Check if .env is in .gitignore
  const gitignorePath = join(ROOT, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignore = readFileSync(gitignorePath, 'utf-8');
    if (!gitignore.includes('.env')) {
      addIssue('CRITICAL', '.gitignore', '.env is not listed in .gitignore');
    }
  }

  // Check .env.example doesn't have real secrets
  const envExamplePath = join(ROOT, '.env.example');
  if (existsSync(envExamplePath)) {
    const envExample = readFileSync(envExamplePath, 'utf-8');
    if (/sk-[a-zA-Z0-9]{20,}/.test(envExample)) {
      addIssue('CRITICAL', '.env.example', 'Real API key found in .env.example');
    }
  }
}

function checkDependencies() {
  const packagePath = join(ROOT, 'package.json');
  if (!existsSync(packagePath)) return;

  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Known vulnerable patterns (simplified check)
  const knownIssues: Record<string, string> = {
    'lodash': 'Ensure version >= 4.17.21 for prototype pollution fix',
    'axios': 'Ensure version >= 1.6.0 for SSRF fix',
    'jsonwebtoken': 'Ensure version >= 9.0.0 for security fixes',
  };

  for (const [dep, warning] of Object.entries(knownIssues)) {
    if (allDeps[dep]) {
      addIssue('LOW', 'package.json', `${dep}: ${warning}`);
    }
  }
}

function checkPrismaSchema() {
  const schemaPath = join(ROOT, 'prisma', 'schema.prisma');
  if (!existsSync(schemaPath)) return;

  const schema = readFileSync(schemaPath, 'utf-8');

  // Check for cascade deletes that might be dangerous
  const cascadeMatches = schema.match(/onDelete:\s*Cascade/g);
  if (cascadeMatches && cascadeMatches.length > 5) {
    addIssue('LOW', 'prisma/schema.prisma', `${cascadeMatches.length} cascade deletes found - review for unintended data loss`);
  }

  // Check for missing indexes on userId
  if (schema.includes('userId') && !schema.includes('@@index([userId])')) {
    addIssue('LOW', 'prisma/schema.prisma', 'Some models with userId may be missing index');
  }
}

async function runAudit() {
  console.log(`\n${BOLD}${BLUE}🔒 ALOO Security Audit${RESET}\n`);
  console.log('Scanning project for security issues...\n');

  // Get all TypeScript/JavaScript files
  const files = getAllFiles(join(ROOT, 'src'), ['.ts', '.tsx', '.js', '.jsx']);

  // Check each file
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      checkFile(file, content, lines);
    } catch (err) {
      console.error(`Error reading ${file}:`, err);
    }
  }

  // Additional checks
  checkEnvFiles();
  checkDependencies();
  checkPrismaSchema();

  // Sort issues by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  ISSUES.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Print results
  console.log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

  if (ISSUES.length === 0) {
    console.log(`${GREEN}${BOLD}✅ No security issues found!${RESET}\n`);
    console.log('Your code appears to be secure. However, always consider:');
    console.log('  • Running npm audit for dependency vulnerabilities');
    console.log('  • Testing authentication flows manually');
    console.log('  • Reviewing access control on production\n');
    return 0;
  }

  // Group by severity
  const critical = ISSUES.filter(i => i.severity === 'CRITICAL');
  const high = ISSUES.filter(i => i.severity === 'HIGH');
  const medium = ISSUES.filter(i => i.severity === 'MEDIUM');
  const low = ISSUES.filter(i => i.severity === 'LOW');

  console.log(`${BOLD}Found ${ISSUES.length} potential issues:${RESET}\n`);

  if (critical.length > 0) {
    console.log(`${RED}${BOLD}🚨 CRITICAL (${critical.length})${RESET}`);
    critical.forEach(i => {
      console.log(`   ${RED}•${RESET} ${i.file}${i.line ? `:${i.line}` : ''}`);
      console.log(`     ${i.issue}`);
    });
    console.log();
  }

  if (high.length > 0) {
    console.log(`${YELLOW}${BOLD}⚠️  HIGH (${high.length})${RESET}`);
    high.forEach(i => {
      console.log(`   ${YELLOW}•${RESET} ${i.file}${i.line ? `:${i.line}` : ''}`);
      console.log(`     ${i.issue}`);
    });
    console.log();
  }

  if (medium.length > 0) {
    console.log(`${BLUE}${BOLD}📋 MEDIUM (${medium.length})${RESET}`);
    medium.forEach(i => {
      console.log(`   ${BLUE}•${RESET} ${i.file}${i.line ? `:${i.line}` : ''}`);
      console.log(`     ${i.issue}`);
    });
    console.log();
  }

  if (low.length > 0) {
    console.log(`${GREEN}${BOLD}ℹ️  LOW (${low.length})${RESET}`);
    low.forEach(i => {
      console.log(`   ${GREEN}•${RESET} ${i.file}${i.line ? `:${i.line}` : ''}`);
      console.log(`     ${i.issue}`);
    });
    console.log();
  }

  console.log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

  if (critical.length > 0) {
    console.log(`${RED}${BOLD}❌ CRITICAL issues found - DO NOT publish until fixed!${RESET}\n`);
    return 1;
  }

  if (high.length > 0) {
    console.log(`${YELLOW}${BOLD}⚠️  HIGH priority issues found - review before publishing${RESET}\n`);
    return 1;
  }

  console.log(`${GREEN}${BOLD}✅ No critical/high issues - safe to publish with review${RESET}\n`);
  return 0;
}

// Run the audit
runAudit().then(code => process.exit(code));
