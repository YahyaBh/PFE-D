# Rapport Technique — Marjane Wallet

**Plateforme de Portefeuille Numérique Multi-Dervices Marocain**

---

## Présentation du projet

**Marjane Wallet** est une application web de portefeuille électronique (e-wallet) multi-devises destinée au marché marocain. Elle permet aux utilisateurs de gérer des comptes en **MAD, EUR, USD** (devises fiduciaires) ainsi qu'en **BTC, ETH, USDT** (crypto-monnaies), d'effectuer des transferts, des paiements par QR code, des dépôts, des retraits, et de bénéficier d'un programme de fidélité.

Le projet est développé dans le cadre d'un **Projet de Fin d'Études (PFE)** avec une architecture moderne séparée en deux parties : un **frontend** Next.js et un **backend** Node.js/Express, communiquant via une API REST.

---

## Contexte

Le Maroc connaît une adoption croissante des solutions de paiement numérique. Avec l'émergence des fintechs et l'intérêt grandissant pour les crypto-monnaies, il existe un besoin pour une plateforme unifiée permettant de gérer à la fois les devises traditionnelles et les actifs numériques.

Marjane Wallet répond à ce besoin en proposant une solution complète incluant :
- La gestion de comptes multi-devises
- Les transferts entre utilisateurs
- Les paiements par QR code
- Les cartes virtuelles
- Un portail marchand
- Un panneau d'administration complet

---

## Objectifs

| Objectif | Description |
|----------|-------------|
| **Multi-devises** | Gérer 3 devises fiduciaires (MAD, EUR, USD) et 3 crypto-monnaies (BTC, ETH, USDT) |
| **Sécurité** | Authentification JWT, MFA, validation Joi, rate limiting, journalisation des audits |
| **Temps réel** | Notifications push via Server-Sent Events (SSE) |
| **Double comptabilité** | Système de ledger débit/crédit pour la traçabilité financière |
| **Portail marchand** | Permettre aux commerçants d'accepter les paiements via QR code |
| **Administration** | Interface complète de gestion des utilisateurs, transactions, KYC, litiges |
| **Glassmorphism** | Interface utilisateur moderne avec effet de verre dépoli |

---

## Problématique

Les solutions de paiement numérique au Maroc souffrent de plusieurs limitations :

1. **Fragmentation** : Aucune plateforme ne réunit devises fiduciaires et crypto-monnaies
2. **Sécurité insuffisante** : Peu de solutions offrent une authentification multi-facteurs (MFA) et une journalisation d'audit complète
3. **Traçabilité** : Absence de système de double comptabilité pour la vérification des transactions
4. **Marchands** : Les petits commerçants n'ont pas accès à des solutions de paiement numérique abordables
5. **Administration** : Manque d'outils de gestion centralisée pour la supervision des activités

---

## Solution proposée

Marjane Wallet propose une architecture modulaire en deux parties :

- **Frontend** : Application React/Next.js 14 avec rendu côté client, interface glassmorphism, animations GSAP
- **Backend** : API REST Express.js avec MySQL, JWT, validation Joi, ledger double entrée
- **Déploiement** : Conteneurisation Docker pour la production

Les utilisateurs peuvent s'inscrire, obtenir 6 portefeuilles, effectuer des transactions, scanner des QR codes, et les administrateurs peuvent superviser l'ensemble du système via un panneau dédié.

---

## Description fonctionnelle

L'application s'adresse à trois profils d'utilisateurs :

### Utilisateur Particulier
- Inscription et connexion avec MFA
- Gestion de 6 portefeuilles (MAD, EUR, USD, BTC, ETH, USDT)
- Transferts d'argent entre utilisateurs
- Dépôts et retraits
- Demandes d'argent
- Paiements par QR code
- Gestion de cartes virtuelles MAD
- Conversion de devises
- Vérification KYC
- Programme de fidélité (points et coupons)
- Historique des transactions
- Notifications en temps réel

### Commerçant (Merchant)
- Inscription et demande d'approbation
- Tableau de bord des ventes
- Paiements QR (scan par les clients)
- Demandes de règlement (settlements)
- Graphiques des ventes
- Génération de QR codes personnalisés

### Administrateur
- Connexion séparée (admin login)
- Tableau de bord avec statistiques globales
- Gestion des utilisateurs (suspension, activation)
- Supervision des transactions (avec possibilité d'annulation)
- Gestion des demandes marchandes (approbation/rejet)
- Gestion des vérifications KYC
- Diffusion de notifications
- Consultation des journaux d'audit
- Comptabilité générale (ledger)
- Gestion des litiges

---

## Description technique

### Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Dashboard│  │  Wallet  │  │ Merchant │  │ Admin  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       └──────────────┴─────────────┴────────────┘      │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST
┌──────────────────────────▼──────────────────────────────┐
│                    Backend (Express)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │   Auth   │  │  Wallet  │  │   Ledger (Double-    │  │
│  │ Service  │  │  Service │  │   Entry Accounting)  │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Exchange │  │ Merchant │  │  Notifications (SSE) │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    MySQL 8 Database                      │
│  27+ tables : users, wallet_accounts, transactions,     │
│  ledger_entries, cards, merchants, kyc, disputes, etc.  │
└─────────────────────────────────────────────────────────┘
```

### Flux d'authentification

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client │     │ Frontend │     │ Backend  │     │    DB    │
│ (Navig.) │     │ (Next.js)│     │(Express) │     │ (MySQL)  │
└────┬────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │── Login ──────►│── POST /auth/login ──────────►│
     │                │                │── SELECT user ──►│
     │                │                │◄── user data ────│
     │                │                │── UPDATE mfa ───►│
     │                │◄── {requireMFA: true} ──────────│
     │◄── MFA Request ──┤                │                │
     │                │                │                │
     │── MFA Code ───►│── POST /auth/verify-mfa ──────►│
     │                │                │── SELECT user ──►│
     │                │                │── verify code ──►│
     │                │                │── INSERT refresh │
     │                │◄── {accessToken, refreshToken} ──│
     │◄── Token ──────┤                │                │
     │                │                │                │
     │── API Call ───►│── GET /api/... (Bearer Token) ─►│
     │                │                │── verify JWT ───►│
     │                │◄── Protected Data ──────────────│
     │◄── Response ───┤                │                │
```

---

## Technologies utilisées

| Technologie | Version | Utilisation | Avantages |
|-------------|---------|-------------|-----------|
| **Next.js** | 14.1.0 | Framework frontend React | SSR/SSG/CSR, routing intégré, optimisé |
| **TypeScript** | 5.x | Typage frontend | Sécurité de type, meilleure maintenabilité |
| **Tailwind CSS** | 3.3.0 | Styling CSS utilitaire | Rapidité de développement, personnalisation |
| **React** | 18.x | Bibliothèque UI | Composants réutilisables, écosystème riche |
| **GSAP** | 3.15.0 | Animations JavaScript | Animations fluides et performantes |
| **Recharts** | 3.8.1 | Graphiques React | Charts réactifs pour les statistiques |
| **Lucide React** | 0.332.0 | Icônes SVG | Bibliothèque d'icônes légère et complète |
| **html5-qrcode** | 2.3.8 | Scanner QR code | Lecture QR via caméra navigateur |
| **qrcode.react** | 4.2.0 | Génération QR code | Création de QR codes React |
| **face-api.js** | 0.22.2 | Reconnaissance faciale | Authentification biométrique |
| **Node.js** | 18+ | Runtime backend | JavaScript côté serveur, performant |
| **Express** | 4.18.2 | Framework web backend | Léger, flexible, middleware puissant |
| **MySQL 8** | 8.0 | Base de données relationnelle | Fiabilité, performances, transactions ACID |
| **Knex.js** | 3.2.10 | Query builder / Migrations | Abstraction SQL, migrations versionnées |
| **JWT** | 9.0.3 | Jetons d'authentification | Sans état (stateless), sécurisé |
| **Bcryptjs** | 3.0.3 | Hachage de mots de passe | Sécurisation des credentials |
| **Joi** | 18.2.3 | Validation de schémas | Validation côté serveur robuste |
| **Winston** | 3.19.0 | Journalisation | Logs structurés, multiples transports |
| **Helmet** | 7.1.0 | Sécurité HTTP | Protection contre les vulnérabilités web |
| **Multer** | 2.1.1 | Upload de fichiers | Gestion des documents KYC et preuves |
| **Nodemailer** | 8.0.7 | Envoi d'emails | Notifications par email (MFA, vérification) |
| **Docker** | - | Conteneurisation | Déploiement reproductible |
| **mysql2** | 3.7.0 | Driver MySQL natif | Performant, Promises/async-await |
| **express-rate-limit** | 8.5.2 | Rate limiting | Protection contre les abus et attaques |

---

## Architecture Frontend

### Structure des dossiers

```
frontend/
├── src/
│   ├── app/                    # Pages et layouts (App Router)
│   │   ├── layout.tsx          # Layout racine
│   │   ├── page.tsx            # Landing page
│   │   ├── login/page.tsx      # Connexion utilisateur
│   │   ├── register/page.tsx   # Inscription utilisateur
│   │   ├── dashboard/
│   │   │   ├── layout.tsx      # Layout dashboard
│   │   │   └── page.tsx        # Dashboard principal
│   │   ├── merchant/
│   │   │   ├── layout.tsx      # Layout merchant
│   │   │   ├── login/page.tsx  # Connexion merchant
│   │   │   ├── register/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── qr/page.tsx     # QR codes marchands
│   │   │   ├── history/page.tsx
│   │   │   └── settlements/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx      # Layout admin
│   │   │   ├── login/page.tsx  # Connexion admin
│   │   │   ├── login/layout.tsx
│   │   │   ├── page.tsx        # Dashboard admin
│   │   │   ├── users/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   ├── merchant-requests/page.tsx
│   │   │   ├── ledger/page.tsx
│   │   │   ├── disputes/page.tsx
│   │   │   ├── kyc/page.tsx
│   │   │   └── audit-logs/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── cards/page.tsx
│   │   ├── kyc/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── rewards/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify/page.tsx
│   ├── components/             # Composants réutilisables
│   │   ├── Wallet/             # Composants wallet
│   │   │   ├── TransferModal.tsx
│   │   │   ├── DepositModal.tsx
│   │   │   ├── WithdrawModal.tsx
│   │   │   ├── ConvertModal.tsx
│   │   │   ├── QRScanner.tsx
│   │   │   ├── QRScannerModal.tsx
│   │   │   ├── ReceiveModal.tsx
│   │   │   ├── RequestModal.tsx
│   │   │   ├── VirtualCard.tsx
│   │   │   ├── WalletCard.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── TransactionDetailModal.tsx
│   │   │   └── CardRefillModal.tsx
│   │   ├── ui/                 # Composants UI génériques
│   │   │   ├── ThemeProvider.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── ToastProvider.tsx
│   │   │   ├── LoadingBar.tsx
│   │   │   ├── PhoneInput.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   └── ClientAnimations.tsx
│   │   ├── MerchantSalesChart.tsx
│   │   ├── FaceAuth.tsx
│   │   ├── BiometricOverlay.tsx
│   │   └── NotificationTray.tsx
│   └── lib/
│       ├── api.ts              # Client API avec gestion des tokens
│       └── cryptoAddress.ts    # Génération d'adresses crypto
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Client API (lib/api.ts)

Le fichier `lib/api.ts` est un client HTTP sur mesure qui gère :

- **Injection automatique du token JWT** dans l'en-tête `Authorization`
- **Détection des routes admin** : les endpoints commençant par `/admin/` utilisent automatiquement `admin_token` et `admin_refresh` du localStorage
- **Refresh silencieux** : en cas de 401, le token est rafraîchi automatiquement via `POST /auth/refresh`
- **Clés d'idempotence** : chaque requête non-GET reçoit un en-tête `Idempotency-Key` unique
- **File d'attente de refresh** : si plusieurs requêtes 401 arrivent en même temps, elles sont mises en attente jusqu'au renouvellement du token

### Design Glassmorphism

L'interface utilise un design glassmorphism caractérisé par :
- Arrière-plans `rgba(255,255,255,0.02)` pour les cartes
- `backdrop-filter: blur(16px)` pour l'effet de verre dépoli
- Bordures `rgba(255,255,255,0.06)`
- Accent doré (#FFD700) pour les actions principales
- Accent bleu (#3b82f6) pour l'interface admin

---

## Architecture Backend

### Structure des dossiers

```
backend/
├── src/
│   ├── app.js                  # Point d'entrée Express
│   ├── routes/
│   │   └── api.js              # Définition de toutes les routes API
│   ├── controllers/            # Logique métier des endpoints
│   │   ├── authController.js
│   │   ├── walletController.js
│   │   ├── transactionController.js
│   │   ├── transferController.js
│   │   ├── cardController.js
│   │   ├── dashboardController.js
│   │   ├── merchantController.js
│   │   ├── adminController.js
│   │   ├── kycController.js
│   │   ├── disputeController.js
│   │   ├── notificationController.js
│   │   ├── loyaltyController.js
│   │   ├── profileController.js
│   │   ├── limitController.js
│   │   └── exchangeController.js
│   ├── services/               # Services métier
│   │   ├── walletService.js
│   │   ├── transferService.js
│   │   ├── ledgerService.js
│   │   ├── exchangeService.js
│   │   ├── merchantService.js
│   │   ├── emailService.js
│   │   └── riskService.js
│   ├── middleware/              # Middleware Express
│   │   ├── auth.js             # Vérification JWT
│   │   ├── admin.js            # Vérification rôle admin
│   │   ├── merchant.js         # Vérification rôle merchant
│   │   ├── rateLimit.js        # Rate limiting
│   │   └── idempotency.js      # Protection idempotence
│   └── lib/                    # Utilitaires
│       ├── db.js               # Pool de connexions MySQL
│       ├── config.js           # Validation configuration
│       ├── logger.js           # Winston logger
│       ├── validation.js       # Schémas Joi
│       ├── auditLogger.js      # Journalisation d'audit
│       └── validate.js         # Validation helper
├── database/
│   ├── migrations/             # 13 fichiers de migration Knex
│   ├── seeds/                  # Données de test
│   ├── schema.sql              # Schéma SQL complet
│   └── seed.js                 # Script de seed avancé
├── prisma/
│   └── schema.prisma           # Schéma Prisma (obsolète/stub)
├── docs/
│   └── API.md                  # Documentation API
├── uploads/                    # Fichiers uploadés (KYC, preuves)
└── package.json
```

### Middleware

#### auth.js — Authentication
```javascript
// Extrait le token du header Authorization ou du query param
const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;

// Vérifie le JWT
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Vérifie que l'utilisateur existe et n'est pas suspendu
const [users] = await db.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);
if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended' });

req.user = user;
next();
```

#### admin.js — Vérification Admin
```javascript
if (req.user.role !== 'ROLE_ADMIN') {
  return res.status(403).json({ error: 'Access denied. Admin only.' });
}
next();
```

#### merchant.js — Vérification Merchant
```javascript
const [merchantUsers] = await db.query(
  'SELECT m.* FROM merchants m JOIN merchant_users mu ON m.id = mu.merchant_id WHERE mu.user_id = ?',
  [req.user.id]
);
if (!merchantUsers.length) return res.status(403).json({ error: 'Merchant access only' });
req.merchant = merchantUsers[0];
next();
```

#### rateLimit.js — Limitation de Débit
```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requêtes max
  message: { error: 'Too many requests' }
});

const sensitiveLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,  // 30 minutes
  max: 10,                     // 10 requêtes max (auth)
});
```

#### idempotency.js — Protection Idempotence
```javascript
// Lecture de l'en-tête Idempotency-Key
// Vérification dans la table idempotency_keys
// Si existe déjà, retourne la réponse précédente
// Sinon, intercepte res.json pour stocker la réponse
```

---

## Modules de l'application

### Module Authentification

| Aspect | Détail |
|--------|--------|
| **Objectif** | Gérer l'inscription, connexion, déconnexion, MFA, et gestion des sessions |
| **Fonctionnement** | Inscription avec hachage bcrypt, connexion avec MFA à 6 chiffres, JWT access token (15 min) + refresh token (30 jours) |
| **Entrées** | email, password, name, phone, code MFA |
| **Sorties** | JWT tokens, profil utilisateur, statut MFA |
| **Pages** | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify` |
| **API** | `POST /auth/register`, `POST /auth/login`, `POST /auth/verify-mfa`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| **BD** | `users`, `refresh_tokens`, `device_sessions`, `audit_logs` |

### Module Portefeuille (Wallet)

| Aspect | Détail |
|--------|--------|
| **Objectif** | Gérer les 6 portefeuilles par utilisateur, soldes, conversions |
| **Fonctionnement** | Consultation des soldes, dépôt, retrait, conversion entre devises avec frais |
| **Entrées** | walletId, amount, currency, source, destination |
| **Sorties** | Soldes mis à jour, confirmation de transaction |
| **Pages** | `/dashboard`, composants modaux (Transfer, Deposit, Withdraw, Convert) |
| **API** | `GET /wallet/accounts`, `GET /wallet/balance`, `POST /wallet/convert`, `POST /deposit/process` |
| **BD** | `wallet_accounts`, `transactions`, `ledger_entries` |

### Module Transactions

| Aspect | Détail |
|--------|--------|
| **Objectif** | Transferts P2P, demande d'argent, historique complet |
| **Fonctionnement** | Transfert entre utilisateurs avec frais (0% même devise, 2.5% cross-devise), validation de solde, ledger double entrée |
| **Entrées** | receiverId, amount, currency, note |
| **Sorties** | Transaction créée, soldes mis à jour, notification |
| **Pages** | `/transactions`, `/history`, modals (TransferModal, RequestModal) |
| **API** | `POST /transactions/transfer`, `POST /transactions/request`, `GET /transactions/history` |
| **BD** | `transactions`, `wallet_accounts`, `ledger_entries`, `notifications` |

### Module Paiement QR

| Aspect | Détail |
|--------|--------|
| **Objectif** | Permettre les paiements par scan de QR code |
| **Fonctionnement** | Le scanneur QR capture le code, décode l'ID destinataire, confirme et exécute le paiement |
| **Entrées** | QR code data (receiverId ou merchantId), amount |
| **Sorties** | Paiement exécuté, notification envoyée |
| **Pages** | Composant `QRScanner.tsx`, `QRScannerModal.tsx` |
| **API** | `POST /transactions/qr-payment` |
| **BD** | `transactions`, `wallet_accounts`, `notifications` |

### Module Cartes Virtuelles

| Aspect | Détail |
|--------|--------|
| **Objectif** | Émettre et gérer des cartes bancaires virtuelles en MAD |
| **Fonctionnement** | Génération de numéro 16 chiffres, CVV, date d'expiration (3 ans), plafond de 5 régénérations/mois |
| **Entrées** | walletId, montant de refill |
| **Sorties** | Carte virtuelle créée ou recréée |
| **Pages** | `/cards`, composants `VirtualCard.tsx`, `CardRefillModal.tsx` |
| **API** | `POST /cards/issue`, `GET /cards`, `PATCH /cards/status`, `POST /cards/:cardId/regenerate`, `POST /cards/refill` |
| **BD** | `cards`, `audit_logs` |

### Module Taux de Change

| Aspect | Détail |
|--------|--------|
| **Objectif** | Fournir des taux de change en temps réel |
| **Fonctionnement** | Cache en mémoire avec TTL de 60s, sources : Frankfurter.app, ExchangeRate-API, CoinGecko |
| **Entrées** | Devise source, devise cible, montant |
| **Sorties** | Taux de change, montant converti |
| **API** | `GET /exchange/rates`, `GET /exchange/rates/live`, `POST /exchange/convert` |
| **BD** | `exchange_rates`, `currency_conversions` |

### Module Merchant

| Aspect | Détail |
|--------|--------|
| **Objectif** | Portail marchand pour paiements et analytics |
| **Fonctionnement** | Onboarding, QR codes, ventes, règlements, graphiques |
| **Entrées** | Données d'onboarding, transactions marchandes |
| **Sorties** | Statistiques, QR codes, historique des ventes |
| **Pages** | `/merchant/dashboard`, `/merchant/qr`, `/merchant/history`, `/merchant/settlements` |
| **API** | `GET /merchant/stats`, `GET /merchant/transactions`, `POST /merchant/onboarding`, `GET /merchant/qr` |
| **BD** | `merchants`, `merchant_users`, `merchant_wallets`, `merchant_settlements` |

### Module KYC

| Aspect | Détail |
|--------|--------|
| **Objectif** | Vérification d'identité des utilisateurs |
| **Fonctionnement** | Upload de documents (CIN, selfie, justificatif de domicile), vérification automatique, approbation admin |
| **Entrées** | Documents (JPG/PNG), données personnelles |
| **Sorties** | Statut KYC mis à jour, notification |
| **Pages** | `/kyc` |
| **API** | `GET /kyc/status`, `POST /kyc/upload`, `POST /kyc/submit`, `POST /kyc/auto-verify` |
| **BD** | `kyc_verifications`, `kyc_documents`, `kyc_reviews` |

### Module Notifications

| Aspect | Détail |
|--------|--------|
| **Objectif** | Notifications en temps réel et stockées |
| **Fonctionnement** | SSE (Server-Sent Events) pour le temps réel, polling 15s comme fallback, heartbeat 30s |
| **Entrées** | Événements système, transactions, alertes |
| **Sorties** | Notifications push, badge de lecture |
| **Pages** | Composant `NotificationTray.tsx` |
| **API** | `GET /notifications/stream` (SSE), `GET /notifications`, `PATCH /notifications/read-all` |
| **BD** | `notifications` |

### Module Administration

| Aspect | Détail |
|--------|--------|
| **Objectif** | Superviser l'ensemble du système |
| **Fonctionnement** | Statistiques, gestion utilisateurs, supervision transactions, KYC, marchands, litiges, ledger, diffusion |
| **Entrées** | Filtres, actions administratives |
| **Sorties** | Tableaux de bord, rapports |
| **Pages** | `/admin/`, `/admin/users`, `/admin/transactions`, `/admin/merchant-requests`, `/admin/ledger`, `/admin/disputes`, `/admin/kyc`, `/admin/audit-logs` |
| **API** | `GET /admin/stats`, `GET /admin/users`, `GET /admin/transactions`, `POST /admin/broadcast`, `GET /admin/audit-logs` |
| **BD** | Toutes les tables (vue globale) |

---

## Fonctionnalités

### Fonctionnalités Utilisateur

1. **Inscription** avec création automatique de 6 portefeuilles
2. **Connexion** avec MFA (code à 6 chiffres)
3. **Dashboard** avec soldes, transactions récentes, statistiques
4. **Gestion des portefeuilles** : MAD, EUR, USD, BTC, ETH, USDT
5. **Transfert P2P** entre utilisateurs (même devise : 0% frais, cross-devise : 2,5%)
6. **Dépôt** par carte bancaire (1,5%) ou virement (1%)
7. **Retrait** MAD (2%), EUR/USD (2,5%), crypto (0%)
8. **Conversion de devises** avec taux en temps réel
9. **Paiement QR** par scan caméra
10. **Demande d'argent** à d'autres utilisateurs
11. **Cartes virtuelles MAD** (émission, gel, régénération, refill multi-devises)
12. **Historique des transactions** avec filtres et pagination
13. **Vérification KYC** avec upload de documents
14. **Programme de fidélité** (points et coupons)
15. **Notifications en temps réel** (SSE)

### Fonctionnalités Marchand

16. **Onboarding** avec demande d'approbation
17. **Dashboard marchand** avec ventes et statistiques
18. **Paiements QR** (génération et scan)
19. **Historique des transactions** marchandes
20. **Demandes de règlement** (settlements)
21. **Graphiques des ventes** (30 jours)

### Fonctionnalités Administrateur

22. **Dashboard admin** avec statistiques globales
23. **Gestion des utilisateurs** (liste, détails, suspension, activation, réinitialisation MFA)
24. **Supervision des transactions** (liste, détails, annulation)
25. **Gestion des demandes marchandes** (approbation, rejet)
26. **Comptabilité générale** (ledger accounts, journal entries, réconciliation)
27. **Gestion des litiges** (visualisation, preuves, résolution)
28. **Vérifications KYC** (approbation, rejet)
29. **Diffusion de notifications** (ciblage : tous, utilisateurs, marchands)
30. **Journal d'audit** (consultation et recherche)

---

## Structure du projet (détaillée)

### Dossier racine (`PFE-D/`)

| Fichier/Dossier | Description |
|-----------------|-------------|
| `backend/` | API Express, migrations, services, middleware |
| `frontend/` | Application Next.js, composants, pages |
| `docker-compose.yml` | Orchestration Docker (MySQL + Backend + Frontend) |
| `README.md` | Documentation générale du projet |
| `CLAUDE.md` | Instructions pour l'assistant IA |
| `INFO_AI.md` | Documentation pour l'IA |
| `FINAL-STRUC.md` | Structure finale du projet |
| `AUDIT.md` | Rapport d'audit |
| `hero-preview.html` | Aperçu HTML de la page d'accueil |

### Backend (`backend/`)

| Dossier | Description |
|---------|-------------|
| `src/controllers/` | 15 contrôleurs gérant la logique métier |
| `src/services/` | 7 services (wallet, transfer, ledger, exchange, merchant, email, risk) |
| `src/middleware/` | 5 middlewares (auth, admin, merchant, rateLimit, idempotency) |
| `src/lib/` | 6 modules utilitaires (db, config, logger, validation, audit, validate) |
| `src/routes/` | Définition des routes API (188 endpoints) |
| `database/migrations/` | 13 migrations Knex versionnées |
| `database/seeds/` | Données de démonstration |
| `prisma/` | Schéma Prisma (non utilisé en production) |
| `docs/` | Documentation API |
| `uploads/` | Fichiers uploadés |

### Frontend (`frontend/`)

| Dossier | Description |
|---------|-------------|
| `src/app/` | Pages Next.js (App Router) |
| `src/components/` | Composants React réutilisables |
| `src/components/Wallet/` | 13 composants liés au portefeuille |
| `src/components/ui/` | 10 composants UI génériques |
| `src/lib/` | Client API et utilitaires |

---

## Gestion des utilisateurs

### Modèle de données

```sql
users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(255) UNIQUE,
  role VARCHAR(20) DEFAULT 'ROLE_USER',   -- ROLE_USER, ROLE_MERCHANT, ROLE_ADMIN
  status VARCHAR(20) DEFAULT 'active',     -- active, suspended
  tier VARCHAR(20) DEFAULT 'FREE',         -- FREE, BRONZE, SILVER, GOLD, PLATINUM
  kyc_status VARCHAR(20) DEFAULT 'UNVERIFIED',
  loyalty_points INT DEFAULT 0
)
```

### Rôles

| Rôle | Accès |
|------|-------|
| `ROLE_USER` | Dashboard personnel, wallet, transactions, cartes |
| `ROLE_MERCHANT` | Accès utilisateur + portail marchand |
| `ROLE_ADMIN` | Accès complet au panneau d'administration |

### Portefeuilles par utilisateur

Chaque inscription crée 6 comptes :

| Devise | Type | Statut |
|--------|------|--------|
| MAD | fiat | active |
| EUR | fiat | active |
| USD | fiat | active |
| BTC | crypto | pending_regulation |
| ETH | crypto | pending_regulation |
| USDT | crypto | pending_regulation |

---

## Authentification

### Flux complet

```
1. POST /auth/login → { email, password }
   → Vérification bcrypt
   → Génération code MFA (6 chiffres)
   → Stockage en DB (mfa_code, mfa_expires)
   → Retour { requireMFA: true, userId }

2. POST /auth/verify-mfa → { userId, code }
   → Vérification du code MFA
   → Vérification d'expiration (1 heure)
   → Vérification nouvel appareil (risk event)
   → Génération accessToken JWT (15 min)
   → Génération refreshToken (30 jours)
   → Stockage hash du refresh token
   → Retour { accessToken, refreshToken }

3. Requêtes suivantes
   → Header: Authorization: Bearer <accessToken>
   → Middleware auth.js vérifie le JWT
   → Si 401, refresh automatique via POST /auth/refresh
```

### Jetons

| Type | Durée | Stockage Client | Utilisation |
|------|-------|-----------------|-------------|
| Access Token | 15 minutes | localStorage (`token`) | En-tête Authorization |
| Refresh Token | 30 jours | localStorage (`refreshToken`) | Renouvellement du access token |
| Token Admin | 15 minutes | localStorage (`admin_token`) | Routes `/admin/*` |
| Refresh Admin | 30 jours | localStorage (`admin_refresh`) | Renouvellement admin |

### MFA

- Code à 6 chiffres alphanumériques
- Expiration : 1 heure
- Envoi simulé par email (Nodemailer)
- Affichage dans la console en développement

---

## Paiements

### Structure des frais

| Type de transaction | Frais |
|--------------------|-------|
| Transfert P2P (même devise) | 0% |
| Transfert P2P (cross-devise) | 2,5% |
| Dépôt par virement bancaire | 1% |
| Dépôt par carte | 1,5% |
| Dépôt par store/crypto | 0% |
| Retrait MAD | 2% |
| Retrait EUR/USD | 2,5% |
| Retrait crypto | 0% |
| Conversion vers MAD | 1,5% |
| Conversion depuis MAD | 2,5% |
| Paiement marchand | 1,5% |

### Flux d'un transfert P2P

```
1. Frontend : formulaire TransferModal (destinataire, montant, devise)
2. API : POST /transactions/transfer (auth + idempotency)
3. transferController.handleTransfer()
4. transferService.executeTransfer()
   a. Vérification du solde
   b. Calcul des frais (2,5% si cross-devise)
   c. Débit du compte expéditeur (montant + frais)
   d. Crédit du compte destinataire
   e. Enregistrement dans le ledger (double entrée)
   f. Insertion dans transactions (statut COMPLETED)
   g. Attribution de points de fidélité
   h. Notification aux deux parties
   i. Journalisation d'audit
5. Retour : { message, transactionId, fee }
```

---

## Transactions QR

### Fonctionnement

```
1. Utilisateur A (client) ouvre le scanner QR
2. La caméra capture le QR code du commerçant B
3. Le QR code contient l'ID du commerçant (merchantId)
4. L'utilisateur A confirme le montant
5. API : POST /transactions/qr-payment
6. Backend :
   a. Vérifie le solde de A
   b. Récupère le wallet marchand de B
   c. Débite A, crédite B
   d. Enregistre dans ledger
   e. Marque la transaction comme QR_PAYMENT / COMPLETED
   f. Notifie les deux parties
7. Affichage de confirmation
```

### Types de QR supportés

| Type | Contenu | Utilisation |
|------|---------|-------------|
| P2P | receiverId (UUID) | Paiement direct entre utilisateurs |
| Marchand | merchantId (UUID) | Paiement à un commerçant |

---

## Paiements Crypto

Les crypto-monnaies (BTC, ETH, USDT) sont gérées comme des portefeuilles de type "vault" avec statut `pending_regulation`. Le projet inclut :

- **Affichage des soldes** dans le dashboard
- **Génération d'adresses** via `lib/cryptoAddress.ts`
- **Taux de change en direct** via CoinGecko
- **Conversion** entre crypto et devises fiduciaires

Les crypto-monnaies sont intégrées dans la structure multi-devises mais ne disposent pas de fonctionnalités de transfert on-chain. Elles sont traitées comme des actifs internes à la plateforme.

---

## Notifications

### Architecture SSE

```
1. Connexion : GET /notifications/stream?token=<JWT>
2. Backend maintient une connexion HTTP ouverte
3. Heartbeat toutes les 30 secondes (commentaire: "data: \n\n")
4. Envoi d'événements :
   - Nouvelles transactions
   - Alertes de sécurité
   - Changements de statut KYC
   - Événements système
5. Déconnexion : fermeture de la connexion par le client
6. Fallback : polling toutes les 15 secondes via GET /notifications
```

### Types de notifications

| Type | Icône | Description |
|------|-------|-------------|
| `TRANSACTION` | 💳 | Paiement reçu ou envoyé |
| `PAYMENT` | 💰 | Confirmation de paiement |
| `SECURITY_ALERT` | 🔒 | Connexion nouvel appareil |
| `SYSTEM` | ⚙️ | Messages système |
| `SYSTEM_ANNOUNCEMENT` | 📢 | Annonces administrateur |
| `DISPUTE` | ⚖️ | Mise à jour de litige |
| `KYC_UPDATE` | 🆔 | Changement statut KYC |

---

## Dashboard

### Dashboard Utilisateur

Composants affichés :
- **En-tête** : Nom, email, solde total
- **Grille de portefeuilles** : 6 cartes (MAD, EUR, USD, BTC, ETH, USDT)
- **Actions rapides** : Transfert, Dépôt, Retrait, Convertir, Scanner QR, Demander
- **Transactions récentes** : Liste des 20 dernières transactions
- **Carte virtuelle** : Affichage de la carte MAD active
- **Notifications** : Dropdown avec les notifications non lues

### Dashboard Marchand

Composants affichés :
- **Statistiques** : Revenu total, nombre de transactions, commande moyenne, clients uniques
- **Graphique des ventes** : 30 jours (Recharts)
- **Dernières ventes** : Liste des transactions récentes
- **QR Code** : Code QR du marchand

### Dashboard Administrateur

Composants affichés :
- **Statistiques** : Total utilisateurs, actifs, suspendus, transactions, volume
- **Graphiques** : Volume journalier sur 30 jours
- **Activité récente** : 10 dernières entrées d'audit
- **État du système** : Base de données, API, file d'attente

---

## Sécurité

### Mesures de sécurité implémentées

| Mesure | Emplacement | Description |
|--------|-------------|-------------|
| **Helmet** | `app.js` | En-têtes de sécurité HTTP (CSP, XSS, etc.) |
| **CORS** | `app.js` | Origines autorisées configurées |
| **Rate Limiting** | `middleware/rateLimit.js` | 100 req/15min (API), 10 req/30min (auth) |
| **Validation Joi** | `lib/validation.js` | 14 schémas de validation pour toutes les entrées |
| **JWT** | `middleware/auth.js` | Tokens signés avec secret, validation en DB |
| **Bcrypt** | `authController.js` | Hachage des mots de passe (salt 10 rounds) |
| **Idempotence** | `middleware/idempotency.js` | Protection contre la double soumission |
| **Journalisation** | `lib/auditLogger.js` | Toutes les actions sensibles enregistrées |
| **Winston** | `lib/logger.js` | Logs structurés avec rotation en production |
| **MFA** | `authController.js` | Code à 6 chiffres, expiration 1 heure |
| **Suspension** | `middleware/auth.js` | Blocage des comptes suspendus |
| **Face Descriptor** | `authController.js` | Rate limit 5/heure, vérification propriétaire |

### Schémas de validation (Joi)

| Schéma | Endpoint | Champs validés |
|--------|----------|----------------|
| `register` | POST /auth/register | email, password, name, phone |
| `login` | POST /auth/login | email, password |
| `transfer` | POST /transactions/transfer | receiverId, amount, currency |
| `deposit` | POST /deposit/process | amount, currency, source |
| `withdraw` | POST /transactions/withdraw | amount, currency, destination |
| `cardIssue` | POST /cards/issue | |
| `cardRefill` | POST /cards/refill | cardId, amount, sourceWalletId |
| `exchangeConvert` | POST /exchange/convert | from, to, amount |
| `merchantOnboarding` | POST /merchant/onboarding | businessName, businessType |
| `settlementRequest` | POST /merchant/settlements | amount |
| `changePassword` | POST /profile/change-password | currentPassword, newPassword |
| `adminApproveMerchant` | POST /admin/merchant/approve | merchantRequestId, rejectionReason |
| `createDispute` | POST /disputes | transactionId, reason, description |

---

## API

### Routes complètes (188 endpoints)

#### Auth (15 routes)

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| POST | `/auth/register` | sensitiveLimiter, validate | Inscription |
| POST | `/auth/login` | sensitiveLimiter, validate | Connexion |
| POST | `/auth/verify-mfa` | sensitiveLimiter | Vérification MFA |
| POST | `/auth/resend-mfa` | sensitiveLimiter | Renvoi code MFA |
| POST | `/auth/verify-token` | sensitiveLimiter | Vérification email/phone |
| POST | `/auth/resend-verification` | sensitiveLimiter | Renvoi code vérification |
| POST | `/auth/forgot-password` | sensitiveLimiter | Mot de passe oublié |
| POST | `/auth/reset-password` | sensitiveLimiter | Réinitialisation mot de passe |
| POST | `/auth/refresh` | sensitiveLimiter | Rafraîchissement token |
| POST | `/auth/logout` | auth | Déconnexion |
| POST | `/auth/logout-all` | auth | Déconnexion tous appareils |
| GET | `/auth/me` | auth | Profil utilisateur |
| GET | `/auth/user/:userId/face-descriptor` | auth, faceDescriptorLimiter | Données faciales |

#### Wallet (7 routes)

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/wallet` | auth | Portefeuille principal |
| GET | `/wallet/accounts` | auth | Tous les comptes |
| GET | `/wallet/balance` | auth | Solde |
| GET | `/wallet/lookup/:id` | auth | Recherche wallet |
| POST | `/wallet/convert` | auth, validate | Conversion devise |
| GET | `/dashboard/stats` | auth | Statistiques dashboard |

#### Cartes (6 routes)

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| POST | `/cards/issue` | auth, validate | Émission carte |
| GET | `/cards` | auth | Liste cartes |
| PATCH | `/cards/status` | auth | Gel/dégel carte |
| POST | `/cards/:cardId/regenerate` | auth | Régénération |
| POST | `/cards/refill` | auth, validate | Rechargement |
| DELETE | `/cards/:cardId` | auth | Suppression |

#### Transactions (11 routes)

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/transactions/search` | auth | Recherche utilisateur |
| POST | `/transactions/transfer` | auth, sensitiveLimiter, idempotency, validate | Transfert |
| POST | `/transactions/withdraw` | auth, sensitiveLimiter, idempotency, validate | Retrait |
| GET | `/transactions/recent` | auth | Transactions récentes |
| GET | `/transactions/requests` | auth | Demandes en attente |
| POST | `/transactions/request` | auth | Demande d'argent |
| POST | `/transactions/process-request` | auth | Réponse à une demande |
| POST | `/transactions/qr-payment` | auth | Paiement QR |
| GET | `/transactions/history` | auth | Historique complet |

#### Exchange (3 routes)

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/exchange/rates` | - | Taux de change |
| GET | `/exchange/rates/live` | - | Taux en direct |
| POST | `/exchange/convert` | validate | Conversion |

#### KYC (9 routes)

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/kyc/status` | auth | Statut KYC |
| POST | `/kyc/upload` | auth | Upload document |
| POST | `/kyc/submit` | auth | Soumission vérification |
| GET | `/kyc/documents` | auth | Liste documents |
| POST | `/kyc/review` | auth, admin | Revue admin |
| DELETE | `/kyc/documents/:id` | auth | Suppression document |

#### Admin (22 routes)

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| POST | `/admin/login` | sensitiveLimiter, validate | Connexion admin |
| GET | `/admin/stats` | auth, admin | Statistiques globales |
| GET | `/admin/users` | auth, admin | Liste utilisateurs |
| GET | `/admin/users/:id/details` | auth, admin | Détails utilisateur |
| POST | `/admin/users/status` | auth, admin | Changer statut |
| POST | `/admin/users/reset-mfa` | auth, admin | Réinitialiser MFA |
| GET | `/admin/transactions` | auth, admin | Toutes transactions |
| POST | `/admin/transactions/reverse` | auth, admin | Annulation transaction |
| POST | `/admin/broadcast` | auth, admin | Diffusion notification |
| GET | `/admin/audit-logs` | auth, admin | Journal d'audit |
| GET | `/admin/ledger/summary` | auth, admin | Résumé ledger |
| GET | `/admin/ledger/entries` | auth, admin | Entrées ledger |
| POST | `/admin/ledger/reconcile` | auth, admin | Réconciliation |
| GET | `/admin/kyc` | auth, admin | Vérifications KYC |
| POST | `/admin/kyc/:id/approve` | auth, admin | Approuver KYC |
| POST | `/admin/kyc/:id/reject` | auth, admin | Rejeter KYC |
| GET | `/admin/notifications` | auth, admin | Notifications admin |
| GET | `/admin/notifications/stream` | auth, admin | SSE admin |
| GET | `/admin/merchant/requests` | auth, admin | Demandes marchandes |
| POST | `/admin/merchant/approve` | auth, admin, validate | Approuver marchand |
| POST | `/admin/merchant/reject/:id` | auth, admin | Rejeter marchand |

#### Litiges (9 routes)

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| POST | `/disputes` | auth, validate | Créer litige |
| GET | `/disputes` | auth | Mes litiges |
| GET | `/disputes/:id/messages` | auth | Messages litige |
| POST | `/disputes/message` | auth | Ajouter message |
| POST | `/disputes/:id/evidence` | auth | Upload preuve |
| GET | `/disputes/:id/evidence` | auth | Preuves litige |
| GET | `/admin/disputes` | auth, admin | Tous les litiges |
| POST | `/admin/disputes/resolve` | auth, admin | Résoudre litige |

#### Merchant (12 routes)

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/merchant/status` | auth | Statut marchand |
| GET | `/merchant/stats` | auth, merchant | Statistiques |
| GET | `/merchant/transactions` | auth, merchant | Transactions |
| GET | `/merchant/settlements` | auth, merchant | Règlements |
| POST | `/merchant/settlements` | auth, merchant, validate | Demande règlement |
| POST | `/merchant/onboarding` | auth, validate | Demande onboarding |
| GET | `/merchant/sales-chart` | auth, merchant | Graphique ventes |
| GET | `/merchant/latest-sales` | auth, merchant | Dernières ventes |
| GET | `/merchant/qr` | auth, merchant | QR code |
| POST | `/merchant/qr/generate` | auth, merchant | Générer QR |

---

## Base de données

### Liste complète des tables (27+)

| Table | Description | Colonnes principales |
|-------|-------------|---------------------|
| **users** | Utilisateurs | id, email, password, name, phone, role, status, tier, kyc_status, loyalty_points, face_descriptor, mfa_code, mfa_expires, is_email_verified, is_phone_verified |
| **tiers** | Niveaux de fidélité | id, name, minSpent, maxSpent, benefits |
| **wallet_accounts** | Portefeuilles (6 par user) | id, user_id, balance, currency, type (fiat/crypto/merchant), status, label |
| **wallets** | Ancienne table (legacy) | id, user_id, balance, currency |
| **transactions** | Transactions | id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, fee, note, description |
| **cards** | Cartes virtuelles | id, user_id, wallet_id, card_number, card_holder, expiry_date, cvv, status, balance |
| **device_sessions** | Sessions appareils | id, user_id, device, ip, last_login |
| **refresh_tokens** | Tokens de rafraîchissement | id, user_id, token_hash, expires_at, device_info |
| **idempotency_keys** | Protection idempotence | id, key, response, created_at |
| **audit_logs** | Journal d'audit | id, user_id, action, resource, resource_id, details, ip_address |
| **risk_events** | Événements de risque | id, user_id, event_type, score, details |
| **ledger_accounts** | Comptes ledger | id, owner_id, name, type (ASSET/LIABILITY/REVENUE), balance, currency |
| **ledger_entries** | Écritures comptables | id, transaction_id, account_id, amount, description |
| **disputes** | Litiges | id, transaction_id, user_id, reason, description, status (OPEN/RESOLVED), resolution_note |
| **dispute_evidence** | Preuves de litige | id, dispute_id, file_path, file_name, uploaded_by |
| **dispute_messages** | Messages de litige | id, dispute_id, user_id, message |
| **exchange_rates** | Taux de change | id, base_currency, target_currency, rate, updated_at |
| **currency_conversions** | Historique conversions | id, user_id, from_currency, to_currency, amount, result, fee |
| **merchants** | Commerçants | id, user_id, business_name, business_type, status, rc_number, ice_number, tax_id |
| **merchant_users** | Lien user↔merchant | id, merchant_id, user_id, role |
| **merchant_wallets** | Wallets marchands | id, merchant_id, balance, currency |
| **merchant_settlements** | Règlements marchands | id, merchant_id, amount, currency, status |
| **merchant_requests** | Demandes onboarding | id, user_id, business_name, business_type, status, rc_number, ice_number, tax_id, documents_status |
| **wallet_limits** | Limites wallets | id, tier, currency, daily_limit, monthly_limit |
| **kyc_verifications** | Vérifications KYC | id, user_id, status, risk_score, submitted_at |
| **kyc_documents** | Documents KYC | id, verification_id, user_id, type, file_path, file_name |
| **kyc_reviews** | Revues KYC | id, verification_id, reviewer_id, action, note |
| **notifications** | Notifications | id, user_id, type, title, message, is_read, level, target |
| **coupons** | Coupons de fidélité | id, code, description, discount_percentage, points_cost, expiry_date, is_active |
| **user_coupons** | Coupons utilisateurs | id, user_id, coupon_id, is_used |

---

## Algorithmes importants

### 1. Calcul des frais de transaction

```
Fonction calculerFrais(type, montant, deviseSource, deviseCible):
  Si type === 'P2P':
    Si deviseSource === deviseCible:
      retourner 0
    Sinon:
      retourner montant * 0.025  // 2.5%
  
  Si type === 'DEPOSIT':
    Si source === 'bank': retourner montant * 0.01
    Si source === 'card': retourner montant * 0.015
    Sinon: retourner 0  // store/crypto
  
  Si type === 'WITHDRAWAL':
    Si devise === 'MAD': retourner montant * 0.02
    Si devise === 'EUR' ou 'USD': retourner montant * 0.025
    Si crypto: retourner 0
  
  Si type === 'CONVERSION':
    Si vers MAD: retourner montant * 0.015
    Si depuis MAD: retourner montant * 0.025
```

### 2. Génération de carte virtuelle

```
Fonction genererCarte():
  // 16 chiffres format Visa
  prefixe = '4'
  reste = 15 chiffres aléatoires
  numero = prefixe + reste
  
  // Algorithme de Luhn pour le checksum
  chiffres = numero.split('').map(parseInt)
  somme = 0
  Pour i = 0 à 14:
    Si i % 2 === 0:  // pairs (depuis la droite)
      chiffre = chiffres[14 - i] * 2
      Si chiffre > 9: chiffre -= 9
    Sinon:
      chiffre = chiffres[14 - i]
    somme += chiffre
  checksum = (10 - (somme % 10)) % 10
  
  // CVV : 3 chiffres aléatoires
  cvv = random(100, 999)
  
  // Expiration : +3 ans
  dateExpiration = maintenant + 3 ans
  format = MM/YY
  
  retourner { numero + checksum, cvv, dateExpiration }
```

### 3. Double comptabilité (Ledger)

```
Fonction enregistrerTransaction(connection, transactionId, ecritures):
  // Principe : somme des montants = 0
  // Chaque écriture a un montant positif (crédit) ou négatif (débit)
  
  Pour chaque écriture dans ecritures:
    connection.query(
      'INSERT INTO ledger_entries (id, transaction_id, account_id, amount, description)
       VALUES (?, ?, ?, ?, ?)',
      [uuid(), transactionId, écriture.accountId, écriture.amount, écriture.description]
    )
    
    connection.query(
      'UPDATE ledger_accounts SET balance = balance + ? WHERE id = ?',
      [écriture.amount, écriture.accountId]
    )
  
  Vérifier: SUM(écritures.amount) === 0  // Principe de conservation
  
  // Exemple transfert P2P 100 MAD :
  //   Compte expéditeur : -100 MAD (débit)
  //   Compte destinataire : +100 MAD (crédit)
  //   Total : 0 ✓
```

### 4. Cache des taux de change

```
// Cache en mémoire avec TTL
cache = {}
TTL = 60 secondes

Fonction getRates():
  Si cache.rates ET (maintenant - cache.timestamp < TTL):
    retourner cache.rates
  
  // Sinon, fetch depuis les API externes
  tauxFrankfurter = fetch('https://api.frankfurter.app/latest')
  tauxExchangeRate = fetch('https://api.exchangerate-api.com/v4/latest/MAD')
  tauxCoinGecko = fetch('https://api.coingecko.com/api/v3/simple/price')
  
  cache.rates = fusionner(tauxFrankfurter, tauxExchangeRate, tauxCoinGecko)
  cache.timestamp = maintenant
  
  retourner cache.rates
```

### 5. Gestion des régénérations de carte

```
Fonction peutRegenererCarte(userId, cardId):
  // Limite : 5 régénérations par mois
  debutMois = premierJourDuMois(maintenant)
  
  count = DB.query(
    'SELECT COUNT(*) FROM audit_logs 
     WHERE user_id = ? AND action = 'CARD_REGENERATED' 
     AND created_at >= ?',
    [userId, debutMois]
  )
  
  retourner count < 5
```

### 6. Refresh Token avec rotation

```
Fonction refreshToken(refreshToken):
  // 1. Cherche tous les tokens non expirés
  tokens = DB.query('SELECT * FROM refresh_tokens WHERE expires_at > NOW()')
  
  // 2. Compare avec bcrypt (pas de recherche directe possible à cause du hash)
  Pour chaque token dans tokens:
    Si bcrypt.compare(refreshToken, token.token_hash):
      validToken = token
      break
  
  // 3. Supprime l'ancien token (rotation)
  DB.query('DELETE FROM refresh_tokens WHERE id = ?', [validToken.id])
  
  // 4. Génère un nouveau token
  nouveauRefreshToken = uuid()
  hash = bcrypt.hash(nouveauRefreshToken)
  DB.query('INSERT INTO refresh_tokens ...', [newId, validToken.user_id, hash, ...])
  
  // 5. Nouveau JWT
  nouveauAccessToken = jwt.sign({ id: validToken.user_id }, SECRET, { expiresIn: '15m' })
  
  retourner { accessToken: nouveauAccessToken, refreshToken: nouveauRefreshToken }
```

---

## Difficultés techniques rencontrées

### 1. Problème de duplication du flux caméra (QR Scanner)

**Problème** : La bibliothèque `html5-qrcode` créait des éléments `<canvas>` et `<img>` visibles dans le DOM en plus de l'élément `<video>`, provoquant l'affichage de deux flux caméra superposés.

**Solution** : Injection d'une feuille de style CSS pour masquer ces éléments :
```css
#qr-reader__dashboard_section_camera img,
#qr-reader__camera_permission_button img,
#qr-reader__scan_region img,
video + canvas,
video ~ canvas,
#qr-reader__scan_region canvas {
  display: none !important;
}
```

### 2. Erreur "Cannot stop, scanner is not running or paused"

**Problème** : React 18 StrictMode provoque un double montage des composants. `scanner.stop()` était appelé avant que `scanner.start()` (asynchrone) n'ait terminé, levant une erreur synchrone.

**Solution** : 
```javascript
// Flag de sécurité pour éviter stop() avant start()
const [started, setStarted] = useState(false);

// Dans le cleanup :
if (started) {
  try { scanner.stop(); } catch (e) { /* Ignorer */ }
}
```

### 3. Page de connexion admin vide

**Problème** : Le layout admin (`admin/layout.tsx`) vérifiait la présence du token admin. Si absent, il appelait `router.replace("/admin/login")` sans jamais passer `checked = true`, retournant indéfiniment `null`.

**Solution** : Détection de la route `/admin/login` pour ignorer la vérification d'auth et rendre les enfants bruts :
```javascript
const isLoginPage = pathname === "/admin/login";
if (isLoginPage) {
  setChecked(true);
  return;
}
// ...
if (isLoginPage) return <>{children}</>;
```

### 4. Refresh token avec hash bcrypt

**Problème** : Les refresh tokens sont stockés hashés avec bcrypt, ce qui empêche la recherche directe par valeur (pas de `WHERE token_hash = ?`).

**Solution** : Parcours de tous les tokens non expirés et comparaison avec `bcrypt.compare()` pour chaque entrée. Cette approche, bien que moins performante, est sécurisée.

### 5. SSE et limitations EventSource

**Problème** : L'API EventSource ne supporte pas les en-têtes personnalisés (comme `Authorization`).

**Solution** : Passage du token JWT via paramètre de requête :
```
GET /notifications/stream?token=<JWT>
```

---

## Améliorations possibles

### Court terme

1. **Tests automatisés** : Ajouter des tests unitaires et d'intégration couvrant les 188 endpoints
2. **WebSocket** : Remplacer SSE par WebSocket pour une communication bidirectionnelle
3. **Pagination optimisée** : Ajouter des curseurs (cursor-based pagination) pour les grandes listes
4. **Cache Redis** : Déplacer le cache des taux de change de la mémoire locale vers Redis

### Moyen terme

5. **Intégration bancaire réelle** : Connecter l'API à des services bancaires marocains (CMI, HPS)
6. **Paiement par NFC** : Ajouter le support du sans-contact pour les cartes virtuelles
7. **Application mobile** : Développer une application React Native ou Flutter
8. **Multi-langue** : Ajouter le support de l'arabe et de l'anglais
9. **Export de données** : CSV, PDF pour les relevés de compte

### Long terme

10. **Crypto on-chain** : Implémenter de vraies transactions blockchain
11. **Marketplace** : Place de marché pour les commerçants
12. **IA anti-fraude** : Détection automatique des transactions suspectes avec machine learning
13. **API publique** : Ouvrir l'API aux développeurs tiers avec clés d'API
14. **PWA** : Progressive Web App pour une expérience mobile native

---

## Diagrammes d'architecture

[Figure 1 : Page d'accueil — Landing page avec hero, fonctionnalités et footer]
*Emplacement : frontend/src/app/page.tsx*

[Figure 2 : Dashboard utilisateur — Soldes, actions rapides, transactions récentes]
*Emplacement : frontend/src/app/dashboard/page.tsx*

[Figure 3 : Connexion — Formulaire email/mot de passe avec MFA]
*Emplacement : frontend/src/app/login/page.tsx*

[Figure 4 : Inscription — Création de compte avec création des 6 wallets]
*Emplacement : frontend/src/app/register/page.tsx*

[Figure 5 : Dashboard administrateur — Statistiques globales et graphiques]
*Emplacement : frontend/src/app/admin/page.tsx*

[Figure 6 : Connexion administrateur — Interface dédiée avec fond sombre]
*Emplacement : frontend/src/app/admin/login/page.tsx*

[Figure 7 : Gestion des utilisateurs (admin) — Liste, filtres, détails]
*Emplacement : frontend/src/app/admin/users/page.tsx*

[Figure 8 : Transactions (admin) — Liste complète avec filtres et annulation]
*Emplacement : frontend/src/app/admin/transactions/page.tsx*

[Figure 9 : Demandes marchandes (admin) — Approbation/rejet des commerçants]
*Emplacement : frontend/src/app/admin/merchant-requests/page.tsx*

[Figure 10 : Comptabilité générale (admin) — Ledger et réconciliation]
*Emplacement : frontend/src/app/admin/ledger/page.tsx*

[Figure 11 : Litiges (admin) — Gestion des disputes avec preuves]
*Emplacement : frontend/src/app/admin/disputes/page.tsx*

[Figure 12 : Vérifications KYC (admin) — Approbation/rejet des documents]
*Emplacement : frontend/src/app/admin/kyc/page.tsx*

[Figure 13 : Journal d'audit (admin) — Consultation des actions]
*Emplacement : frontend/src/app/admin/audit-logs/page.tsx*

[Figure 14 : Dashboard marchand — Statistiques et graphiques des ventes]
*Emplacement : frontend/src/app/merchant/dashboard/page.tsx*

[Figure 15 : QR Code marchand — Génération et affichage]
*Emplacement : frontend/src/app/merchant/qr/page.tsx*

[Figure 16 : Historique marchand — Transactions et règlements]
*Emplacement : frontend/src/app/merchant/history/page.tsx*

[Figure 17 : Portefeuilles — Affichage des 6 comptes (MAD, EUR, USD, BTC, ETH, USDT)]
*Emplacement : composant WalletCard*

[Figure 18 : Transfert d'argent — Modal de transfert P2P]
*Emplacement : composant TransferModal*

[Figure 19 : Scan QR — Scanner caméra pour paiement]
*Emplacement : composant QRScanner*

[Figure 20 : Cartes virtuelles — Gestion des cartes MAD]
*Emplacement : frontend/src/app/cards/page.tsx*

---

## Conclusion

**Marjane Wallet** est une solution complète de portefeuille numérique multi-devises adaptée au marché marocain. L'application combine des technologies modernes (Next.js 14, Express, MySQL) avec des principes financiers solides (double comptabilité, idempotence, MFA) pour offrir une plateforme sécurisée et scalable.

L'architecture modulaire permet une séparation claire des responsabilités entre le frontend (interface utilisateur) et le backend (API REST + services métier). Le système de ledger à double entrée garantit l'intégrité financière des transactions, tandis que les middlewares de sécurité (auth, rate limiting, idempotence, validation) protègent contre les abus.

Les fonctionnalités couvrent l'ensemble des besoins d'une plateforme fintech : gestion multi-devises, transferts, paiements QR, cartes virtuelles, portail marchand, vérification KYC, litiges, notifications temps réel, et administration complète.

---

*Document généré le 26 juin 2026 — Projet Marjane Wallet PFE*
