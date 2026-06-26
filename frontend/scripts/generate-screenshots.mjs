/**
 * Marjane Wallet — Automatic Documentation Screenshot Generator
 *
 * Generates all screenshots required for PFE report.
 * Uses Playwright to navigate pages, handle auth (admin via API, user via DB MFA),
 * and capture rendered pages at 1920×1080.
 *
 * Usage:
 *   1. Ensure backend (port 5000) and frontend (port 3000) are running
 *   2. node scripts/generate-screenshots.mjs
 *
 * Environment variables (optional):
 *   DATABASE_URL  – MySQL connection string (default: mysql://root@localhost:3306/marjane_wallet)
 *   BASE_URL      – Frontend URL          (default: http://localhost:3000)
 *   API_URL       – Backend API URL       (default: http://localhost:5000/api)
 *   OUT_DIR       – Screenshot output dir (default: documentation/screenshots)
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

// ─── Config ────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const CFG = {
  baseUrl:     process.env.BASE_URL || 'http://127.0.0.1:3000',
  apiUrl:      process.env.API_URL  || 'http://127.0.0.1:5000/api',
  dbUrl:       process.env.DATABASE_URL || 'mysql://root@localhost:3306/marjane_wallet',
  outDir:      resolve(PROJECT_ROOT, process.env.OUT_DIR || 'documentation/screenshots'),
  viewport:    { width: 1920, height: 1080 },
  adminEmail:  'admin@marjane.ma',
  adminPass:   'admin123',
  demoEmail:   'demo@marjane.ma',
  demoPass:    'marjane2026',
};

// ─── State ─────────────────────────────────────────────────────────────────────

const stats = { discovered: 0, captured: 0, skipped: 0, skipReasons: [] };
const captions = [];
let pageNum = 1;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

async function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function figureName(label) {
  const n = String(pageNum++).padStart(2, '0');
  return { seq: n, fileName: `${n}-${label}.png`, fig: `Figure 4.${pageNum - 1}` };
}

async function screenshot(page, label, opts = {}) {
  const { seq, fileName, fig } = figureName(label);
  const filePath = resolve(CFG.outDir, fileName);

  // Wait for content stability
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(opts.wait || 1200);

  // If a custom action is needed before the shot
  if (opts.before) await opts.before(page);

  // Hide transient UI elements
  await page.evaluate(() => {
    document.querySelectorAll('[role="tooltip"], .toast, .Toast, [class*="toast"]')
      .forEach(el => el.remove());
  });

  // Capture
  await page.screenshot({ path: filePath, fullPage: opts.fullPage ?? true });
  stats.captured++;

  const desc = opts.desc || label;
  captions.push(`| ${fig} | ${desc} | ${fileName} |`);
  log(`  ✓ ${fig} — ${fileName}`);
}

async function visit(page, path, opts = {}) {
  stats.discovered++;
  const url = `${CFG.baseUrl}${path}`;
  log(`→ ${path}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Wait for React hydration
  await page.waitForTimeout(800);
  return page;
}

async function localStorageSet(page, items) {
  await page.evaluate((data) => {
    for (const [k, v] of Object.entries(data)) {
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
  }, items);
}

async function localStorageClear(page, keys) {
  await page.evaluate((ks) => ks.forEach(k => localStorage.removeItem(k)), keys);
}

// ─── Database helpers ──────────────────────────────────────────────────────────

let dbPool = null;

async function getDb() {
  if (!dbPool) {
    dbPool = mysql.createPool({ uri: CFG.dbUrl, connectionLimit: 2 });
  }
  return dbPool;
}

/**
 * Retrieve MFA code from DB for a given email.
 * The code was set by POST /auth/login with a 1-hour expiry.
 */
async function getMfaCode(email) {
  const pool = await getDb();
  const [rows] = await pool.query(
    'SELECT mfa_code, mfa_expires FROM users WHERE email = ?',
    [email]
  );
  if (!rows.length) throw new Error(`User not found: ${email}`);
  if (!rows[0].mfa_code) throw new Error(`No MFA code set for ${email}. Have you called /auth/login first?`);
  log(`  MFA code for ${email}: ${rows[0].mfa_code}`);
  return rows[0].mfa_code;
}

// ─── Auth helpers ───────────────────────────────────────────────────────────────

/**
 * Authenticate as admin via API (no MFA required).
 * Returns { accessToken, refreshToken, admin }.
 */
async function apiAdminLogin() {
  const res = await fetch(`${CFG.apiUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CFG.adminEmail, password: CFG.adminPass }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Admin login failed: ${err.error}`);
  }
  return res.json();
}

/**
 * Authenticate as demo user via API + DB MFA code.
 * Returns { accessToken, refreshToken }.
 */
async function apiUserLogin() {
  // Step 1: POST /auth/login – triggers MFA code creation in DB
  const loginRes = await fetch(`${CFG.apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CFG.demoEmail, password: CFG.demoPass }),
  });
  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`User login failed: ${err.error}`);
  }
  const loginData = await loginRes.json();
  if (!loginData.requireMFA) throw new Error('Expected MFA to be required');
  const { userId } = loginData;
  log(`  User login OK, userId=${userId}, fetching MFA code from DB...`);

  // Step 2: Read MFA code from database
  const mfaCode = await getMfaCode(CFG.demoEmail);

  // Step 3: POST /auth/verify-mfa
  const mfaRes = await fetch(`${CFG.apiUrl}/auth/verify-mfa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code: mfaCode }),
  });
  if (!mfaRes.ok) {
    const err = await mfaRes.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`MFA verification failed: ${err.error}`);
  }
  const mfaData = await mfaRes.json();
  log(`  MFA OK, token received`);
  return { accessToken: mfaData.accessToken, refreshToken: mfaData.refreshToken };
}

// ─── Setup context with auth ───────────────────────────────────────────────────

/**
 * Create a browser context pre-authenticated for admin.
 */
async function createAdminContext(browser) {
  const ctx = await browser.newContext({ viewport: CFG.viewport });
  const page = await ctx.newPage();

  // Get tokens via API
  const data = await apiAdminLogin();
  const adminUser = { id: data.admin?.id || '', name: data.admin?.name || 'Admin Master', email: CFG.adminEmail, role: 'ROLE_ADMIN' };

  // Navigate to a page so localStorage is available
  await page.goto(`${CFG.baseUrl}/admin/login`, { waitUntil: 'domcontentloaded' });

  // Set admin credentials in localStorage
  await localStorageSet(page, {
    admin_token: data.accessToken || data.token,
    admin_refresh: data.refreshToken,
    admin_user: adminUser,
  });

  log('✓ Admin context ready');
  return { context: ctx, page, tokens: data };
}

/**
 * Create a browser context pre-authenticated as demo user.
 */
async function createUserContext(browser) {
  const ctx = await browser.newContext({ viewport: CFG.viewport });
  const page = await ctx.newPage();

  // Get tokens via API + DB MFA
  const data = await apiUserLogin();

  // Navigate to a page so localStorage is available
  await page.goto(`${CFG.baseUrl}/login`, { waitUntil: 'domcontentloaded' });

  // Set credentials in localStorage
  await localStorageSet(page, {
    token: data.accessToken,
    refreshToken: data.refreshToken,
  });

  log('✓ User context ready');
  return { context: ctx, page, tokens: data };
}

// ─── Screenshot modules ────────────────────────────────────────────────────────

/* ───────── PUBLIC PAGES ───────── */

async function capturePublicPages(browser) {
  log('\n═══ Public Pages ═══');
  const page = await browser.newPage();
  await page.setViewportSize(CFG.viewport);

  await visit(page, '/');
  await screenshot(page, 'home', { desc: 'Page d\'accueil – Landing page avec hero, fonctionnalités et pied de page' });

  await visit(page, '/login');
  await screenshot(page, 'login', { desc: 'Connexion utilisateur – Formulaire email/mot de passe avec MFA et reconnaissance faciale' });

  await visit(page, '/register');
  await screenshot(page, 'register', { desc: 'Inscription – Création de compte avec création automatique de 6 portefeuilles' });

  await visit(page, '/forgot-password');
  await screenshot(page, 'forgot-password', { desc: 'Mot de passe oublié – Demande de réinitialisation par email' });

  await page.close();
}

/* ───────── USER AUTHENTICATED PAGES ───────── */

async function captureUserPages(ctx) {
  log('\n═══ User Pages ═══');
  const page = await ctx.context.newPage();
  await page.setViewportSize(CFG.viewport);

  // Restore auth tokens
  await page.goto(`${CFG.baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
  await localStorageSet(page, {
    token: ctx.tokens.accessToken,
    refreshToken: ctx.tokens.refreshToken,
  });

  // Dashboard
  await visit(page, '/dashboard');
  await screenshot(page, 'dashboard', {
    desc: 'Dashboard utilisateur – Soldes des 6 portefeuilles, actions rapides, transactions récentes',
    wait: 3000,
  });

  // Open Transfer modal
  await visit(page, '/dashboard', { wait: 500 });
  // Try to click the transfer action button
  const transferBtn = page.locator('button', { hasText: /Transfer/i }).first();
  if (await transferBtn.isVisible().catch(() => false)) {
    await transferBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'transfer-modal', { desc: 'Modal de transfert P2P – Envoi d\'argent entre utilisateurs' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Open Deposit modal
  const depositBtn = page.locator('button', { hasText: /Deposit/i }).first();
  if (await depositBtn.isVisible().catch(() => false)) {
    await depositBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'deposit-modal', { desc: 'Modal de dépôt – Approvisionnement du portefeuille (carte, virement, crypto)' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Open Withdraw modal
  const withdrawBtn = page.locator('button', { hasText: /Withdraw/i }).first();
  if (await withdrawBtn.isVisible().catch(() => false)) {
    await withdrawBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'withdraw-modal', { desc: 'Modal de retrait – Retrait de fonds avec frais par devise' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Open Convert modal
  const convertBtn = page.locator('button', { hasText: /Convert/i }).first();
  if (await convertBtn.isVisible().catch(() => false)) {
    await convertBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'convert-modal', { desc: 'Modal de conversion – Conversion entre devises avec taux en direct' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Open QR Scanner modal
  const qrBtn = page.locator('button', { hasText: /Scan/i }).first();
  if (await qrBtn.isVisible().catch(() => false)) {
    await qrBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'qr-scanner-modal', { desc: 'Modal scanner QR – Scan de QR code pour paiement marchand' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Transactions page
  await visit(page, '/transactions');
  await screenshot(page, 'transactions', {
    desc: 'Historique des transactions – Liste complète avec filtres, recherche et pagination',
    wait: 2500,
  });

  // Profile page
  await visit(page, '/profile');
  await screenshot(page, 'profile', {
    desc: 'Profil utilisateur – Informations personnelles, sécurité, sessions',
    wait: 2000,
  });

  // Cards page
  await visit(page, '/cards');
  await screenshot(page, 'cards', {
    desc: 'Cartes virtuelles – Gestion des cartes MAD (émission, gel, régénération)',
    wait: 2000,
  });

  // KYC page
  await visit(page, '/kyc');
  await screenshot(page, 'kyc', {
    desc: 'Vérification KYC – Upload de documents et statut de vérification',
    wait: 2000,
  });

  // Rewards page
  await visit(page, '/rewards');
  await screenshot(page, 'rewards', {
    desc: 'Programme de fidélité – Points, niveau et coupons disponibles',
    wait: 2000,
  });

  await page.close();
}

/* ───────── ADMIN PAGES ───────── */

async function captureAdminPages(browser) {
  log('\n═══ Admin Pages ═══');
  const page = await browser.newPage();
  await page.setViewportSize(CFG.viewport);

  // Admin login page (public)
  await visit(page, '/admin/login');
  await screenshot(page, 'admin-login', { desc: 'Connexion administrateur – Interface dédiée avec fond sombre et grille' });

  // Now authenticate via API
  const data = await apiAdminLogin();
  const adminUser = { id: data.admin?.id || '', name: data.admin?.name || 'Admin Master', email: CFG.adminEmail, role: 'ROLE_ADMIN' };

  await localStorageSet(page, {
    admin_token: data.accessToken || data.token,
    admin_refresh: data.refreshToken,
    admin_user: adminUser,
  });

  // Admin Dashboard
  await visit(page, '/admin');
  await screenshot(page, 'admin-dashboard', {
    desc: 'Dashboard administrateur – Statistiques globales, graphiques, activité récente',
    wait: 4000,
  });

  // Admin Users
  await visit(page, '/admin/users');
  await screenshot(page, 'admin-users', {
    desc: 'Gestion des utilisateurs – Liste paginée avec filtres, recherche et actions',
    wait: 3000,
  });

  // Admin Transactions
  await visit(page, '/admin/transactions');
  await screenshot(page, 'admin-transactions', {
    desc: 'Transactions (admin) – Supervision complète avec filtres et annulation',
    wait: 3000,
  });

  // Admin Merchant Requests
  await visit(page, '/admin/merchant-requests');
  await screenshot(page, 'admin-merchant-requests', {
    desc: 'Demandes marchandes – Approbation et rejet des commerçants',
    wait: 3000,
  });

  // Admin Broadcast
  await visit(page, '/admin/broadcast');
  await screenshot(page, 'admin-broadcast', {
    desc: 'Diffusion de notifications – Envoi ciblé aux utilisateurs et marchands',
    wait: 2000,
  });

  // Admin Audit Logs
  await visit(page, '/admin/audit');
  await screenshot(page, 'admin-audit', {
    desc: 'Journal d\'audit – Traçabilité complète des actions système',
    wait: 3000,
  });

  // Admin General Ledger
  await visit(page, '/admin/ledger');
  await screenshot(page, 'admin-ledger', {
    desc: 'Comptabilité générale – Ledger à double entrée et réconciliation',
    wait: 3000,
  });

  // Admin Disputes
  await visit(page, '/admin/disputes');
  await screenshot(page, 'admin-disputes', {
    desc: 'Litiges – Gestion des disputes avec preuves et résolution',
    wait: 3000,
  });

  // Admin KYC Reviews
  await visit(page, '/admin/kyc');
  await screenshot(page, 'admin-kyc', {
    desc: 'Vérifications KYC – Approbation et rejet des documents d\'identité',
    wait: 3000,
  });

  await page.close();
}

/* ───────── MERCHANT PAGES ───────── */

async function captureMerchantPages(ctx) {
  log('\n═══ Merchant Pages ═══');
  const page = await ctx.context.newPage();
  await page.setViewportSize(CFG.viewport);

  // Restore auth tokens (same user context, merchant middleware checks merchant status)
  await page.goto(`${CFG.baseUrl}/merchant/dashboard`, { waitUntil: 'domcontentloaded' });
  await localStorageSet(page, {
    token: ctx.tokens.accessToken,
    refreshToken: ctx.tokens.refreshToken,
  });

  // Merchant Dashboard
  await visit(page, '/merchant/dashboard');
  await screenshot(page, 'merchant-dashboard', {
    desc: 'Dashboard marchand – Statistiques des ventes, graphique 30 jours, dernières transactions',
    wait: 4000,
  });

  // Merchant QR
  await visit(page, '/merchant/qr');
  await screenshot(page, 'merchant-qr', {
    desc: 'QR code marchand – Génération et affichage du code QR de paiement',
    wait: 3000,
  });

  // Merchant History
  await visit(page, '/merchant/history');
  await screenshot(page, 'merchant-history', {
    desc: 'Historique marchand – Transactions reçues avec filtres',
    wait: 3000,
  });

  // Merchant Settlements
  await visit(page, '/merchant/settlements');
  await screenshot(page, 'merchant-settlements', {
    desc: 'Règlements marchands – Demandes de règlement et historique',
    wait: 3000,
  });

  await page.close();
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log('═══════════════════════════════════════════');
  log('  Marjane Wallet — Screenshot Generator');
  log(`  Output: ${CFG.outDir}`);
  log(`  Frontend: ${CFG.baseUrl}`);
  log(`  API: ${CFG.apiUrl}`);
  log('═══════════════════════════════════════════\n');

  // Verify backend is reachable
  try {
    const health = await fetch(`${CFG.apiUrl}/health`);
    const healthData = await health.json();
    log(`✓ Backend health: ${healthData.status}`);
  } catch (e) {
    log(`✗ Backend not reachable at ${CFG.apiUrl}`);
    log(`  Please start the backend server first:\n    cd backend && npm run dev\n`);
    process.exit(1);
  }

  // Verify frontend is reachable
  try {
    await fetch(CFG.baseUrl);
    log(`✓ Frontend reachable at ${CFG.baseUrl}\n`);
  } catch {
    log(`✗ Frontend not reachable at ${CFG.baseUrl}`);
    log(`  Please start the frontend server first:\n    cd frontend && npm run dev\n`);
    process.exit(1);
  }

  // Verify database is reachable
  try {
    const pool = await getDb();
    await pool.query('SELECT 1');
    log('✓ Database reachable\n');
  } catch (e) {
    log(`✗ Database not reachable: ${e.message}`);
    log('  Screenshots requiring user auth (MFA) will be skipped.');
    stats.skipReasons.push('Database unreachable — user/merchant pages skipped');
  }

  await ensureDir(CFG.outDir);

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Public pages
    await capturePublicPages(browser);

    // 2. Admin pages (separate context, no MFA needed)
    await captureAdminPages(browser);

    // 3. User pages (requires DB for MFA)
    let userCtx = null;
    try {
      userCtx = await createUserContext(browser);
      await captureUserPages(userCtx);
    } catch (e) {
      log(`✗ User auth failed: ${e.message}`);
      stats.skipReasons.push(`User pages: ${e.message}`);
    }

    // 4. Merchant pages (reuse user context if already authenticated as demo)
    //    The demo user is not a merchant, but we can still attempt screenshots
    try {
      if (userCtx) {
        await captureMerchantPages(userCtx);
      }
    } catch (e) {
      log(`✗ Merchant pages failed: ${e.message}`);
      stats.skipReasons.push(`Merchant pages: ${e.message}`);
    }

  } finally {
    await browser.close();
    if (dbPool) await dbPool.end();
  }

  // ─── Generate captions.md ────────────────────────────────────────────────

  const captionMd = [
    '# Cahier des Captures d\'Écran — Marjane Wallet',
    '',
    '**Généré automatiquement le ' + new Date().toLocaleDateString('fr-FR') + '**',
    '',
    '| Figure | Description | Fichier |',
    '|--------|-------------|---------|',
    ...captions,
    '',
  ].join('\n');

  const captionPath = resolve(dirname(CFG.outDir), 'captions.md');
  writeFileSync(captionPath, captionMd, 'utf-8');
  log(`\n✓ Captions written to ${captionPath}`);

  // ─── Summary ──────────────────────────────────────────────────────────────

  log('\n═══════════════════════════════════════════');
  log('  Summary');
  log('═══════════════════════════════════════════');
  log(`  Pages discovered  : ${stats.discovered}`);
  log(`  Screenshots taken : ${stats.captured}`);
  log(`  Output folder     : ${CFG.outDir}`);
  if (stats.skipReasons.length) {
    log(`  Skipped           :`);
    for (const reason of stats.skipReasons) {
      log(`    - ${reason}`);
    }
  }
  log('═══════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
