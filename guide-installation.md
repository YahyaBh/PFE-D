# Guide d'Installation — Marjane Wallet

**Portefeuille Numérique Multi-Devises Marocain**

---

## 1. Présentation

Ce guide détaille les étapes nécessaires pour installer et configurer l'application **Marjane Wallet** sur un environnement local ou serveur.

L'application est composée de deux parties principales :

| Partie | Technologie | Port |
|--------|-------------|------|
| **Frontend** | Next.js 14 (TypeScript, Tailwind CSS) | 3000 |
| **Backend** | Node.js / Express (JavaScript) | 5000 |
| **Base de données** | MySQL 8 | 3306 |

---

## 2. Prérequis

### Logiciels requis

| Logiciel | Version minimale | Commande de vérification |
|----------|-----------------|--------------------------|
| **Node.js** | 18.x | `node --version` |
| **npm** | 9.x | `npm --version` |
| **MySQL** | 8.0 | `mysql --version` |
| **Git** | 2.x | `git --version` |
| **Docker** (optionnel) | 24.x | `docker --version` |

### Installation des prérequis

#### Windows
```powershell
# Node.js + npm : Télécharger depuis https://nodejs.org (v18+ LTS)

# MySQL : Télécharger depuis https://dev.mysql.com/downloads/installer/

# Git : Télécharger depuis https://git-scm.com/download/win

# Vérifications
node --version
npm --version
mysql --version
git --version
```

#### macOS
```bash
# Homebrew (gestionnaire de paquets)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js + npm
brew install node@18

# MySQL
brew install mysql@8.0
brew services start mysql

# Git (préinstallé sur macOS, ou via brew)
brew install git
```

#### Linux (Ubuntu/Debian)
```bash
# Mise à jour des paquets
sudo apt update && sudo apt upgrade -y

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 8
sudo apt install -y mysql-server-8.0
sudo systemctl start mysql
sudo systemctl enable mysql

# Git
sudo apt install -y git
```

---

## 3. Clonage du projet

```bash
# Cloner le dépôt
git clone https://github.com/[organisation]/marjane-wallet.git

# Se déplacer dans le dossier
cd marjane-wallet

# Voir la structure
ls -la
```

**Structure attendue :**
```
marjane-wallet/
├── backend/
├── frontend/
├── docker-compose.yml
├── README.md
└── ...
```

---

## 4. Installation des dépendances

### Backend

```bash
cd backend

# Installer les dépendances
npm install

# Vérifier l'installation
npm ls --depth=0
```

**Dépendances installées :**
| Package | Version | Utilité |
|---------|---------|---------|
| express | ^4.18.2 | Framework web |
| mysql2 | ^3.7.0 | Driver MySQL |
| knex | ^3.2.10 | Query builder / Migrations |
| jsonwebtoken | ^9.0.3 | Jetons JWT |
| bcryptjs | ^3.0.3 | Hachage mots de passe |
| joi | ^18.2.3 | Validation schémas |
| winston | ^3.19.0 | Journalisation |
| helmet | ^7.1.0 | Sécurité HTTP |
| cors | ^2.8.5 | Cross-Origin |
| dotenv | ^16.3.1 | Variables d'environnement |
| multer | ^2.1.1 | Upload fichiers |
| nodemailer | ^8.0.7 | Envoi emails |
| uuid | ^9.0.1 | Génération UUID |
| morgan | ^1.10.0 | Logs HTTP |

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Vérifier l'installation
npm ls --depth=0
```

**Dépendances installées :**
| Package | Version | Utilité |
|---------|---------|---------|
| next | 14.1.0 | Framework React |
| react | ^18 | Bibliothèque UI |
| typescript | ^5 | Typage statique |
| tailwindcss | ^3.3.0 | CSS utilitaire |
| recharts | ^3.8.1 | Graphiques |
| gsap | ^3.15.0 | Animations |
| lucide-react | ^0.332.0 | Icônes |
| html5-qrcode | ^2.3.8 | Scanner QR |
| qrcode.react | ^4.2.0 | Génération QR |
| face-api.js | ^0.22.2 | Reconnaissance faciale |
| clsx | ^2.1.1 | Classes conditionnelles |
| tailwind-merge | ^2.2.1 | Fusion Tailwind |

---

## 5. Variables d'environnement

### Backend

Créer un fichier `.env.development` dans le dossier `backend/` :

```bash
cd backend
cp .env.example .env.development
```

**Tableau des variables :**

| Variable | Description | Obligatoire | Valeur par défaut |
|----------|-------------|-------------|-------------------|
| `NODE_ENV` | Environnement d'exécution | Non | `development` |
| `PORT` | Port du serveur Express | Non | `5000` |
| `DATABASE_URL` | URL de connexion MySQL | **Oui** | `mysql://root@localhost:3306/marjane_wallet` |
| `JWT_SECRET` | Secret pour signer les JWT (min 32 chars) | **Oui** | - |
| `JWT_REFRESH_SECRET` | Secret pour les refresh tokens (min 32 chars) | **Oui** | - |
| `CORS_ORIGINS` | Origines CORS autorisées (production) | Non | `http://localhost:3000` |
| `SMTP_HOST` | Serveur SMTP pour les emails | Non | - |
| `SMTP_PORT` | Port SMTP | Non | `587` |
| `SMTP_USER` | Utilisateur SMTP | Non | - |
| `SMTP_PASS` | Mot de passe SMTP | Non | - |
| `NEXT_PUBLIC_API_URL` | URL de l'API (côté frontend) | Non | `http://localhost:5000/api` |

**Exemple de fichier `.env.development` :**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mysql://root@localhost:3306/marjane_wallet
JWT_SECRET=dev-jwt-secret-key-min-32-characters-long
JWT_REFRESH_SECRET=dev-refresh-secret-key-min-32-characters-long
```

> **⚠️ Avertissement sécurité :** Ne jamais commiter les fichiers `.env` contenant des secrets. Les valeurs ci-dessus sont pour le développement local uniquement. En production, utiliser des secrets forts et un gestionnaire de secrets.

### Frontend

Créer un fichier `.env.local` dans le dossier `frontend/` :

```bash
cd frontend
# Créer le fichier manuellement ou copier depuis un exemple
```

**Variables frontend :**

| Variable | Description | Obligatoire | Défaut |
|----------|-------------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | URL de base de l'API backend | Non | `http://localhost:5000/api` |

**Exemple `.env.local` :**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 6. Configuration

### MySQL

#### Création de la base de données

```bash
# Connexion à MySQL en tant que root
mysql -u root -p

# Création de la base (si elle n'existe pas)
CREATE DATABASE IF NOT EXISTS marjane_wallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Vérification
SHOW DATABASES;
EXIT;
```

#### Configuration du mot de passe root (si nécessaire)

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'votre-mot-de-passe';
FLUSH PRIVILEGES;
```

> **Note :** Par défaut, le projet est configuré pour MySQL sans mot de passe root. Si vous avez un mot de passe, modifiez `DATABASE_URL` : `mysql://root:votre-mot-de-passe@localhost:3306/marjane_wallet`

### Knex (Query Builder)

Le fichier `backend/knexfile.js` lit automatiquement `DATABASE_URL` et parse l'URL pour extraire :
- **host** : `localhost` (par défaut)
- **port** : `3306` (par défaut)
- **user** : `root` (par défaut)
- **password** : vide (par défaut)
- **database** : `marjane_wallet` (par défaut)

---

## 7. Base de données

### Migration

Les migrations utilisent **Knex.js** et sont versionnées (001 à 013).

```bash
cd backend

# Exécuter toutes les migrations
npm run migrate

# Voir le statut des migrations
npx knex migrate:status

# En cas de problème, rollback
npm run migrate:rollback
```

**Ordre des migrations :**

| # | Fichier | Tables créées |
|---|---------|---------------|
| 001 | `001_create_users.js` | users |
| 002 | `002_create_tiers.js` | tiers |
| 003 | `003_create_wallet_accounts.js` | wallet_accounts |
| 004 | `004_create_legacy_wallets.js` | wallets |
| 005 | `005_create_transactions_cards_sessions.js` | transactions, cards, device_sessions |
| 006 | `006_create_refresh_tokens_idempotency.js` | refresh_tokens, idempotency_keys |
| 007 | `007_create_audit_logs_risk_events.js` | audit_logs, risk_events |
| 008 | `008_create_ledger_tables.js` | ledger_accounts, ledger_entries |
| 009 | `009_create_disputes.js` | disputes, dispute_evidence, dispute_messages |
| 010 | `010_create_exchange_tables.js` | exchange_rates, currency_conversions |
| 011 | `011_create_merchant_tables.js` | merchants, merchant_users, merchant_wallets, merchant_settlements, merchant_requests |
| 012 | `012_create_limits_kyc.js` | wallet_limits, kyc_verifications, kyc_documents, kyc_reviews |
| 013 | `013_create_notifications_coupons.js` | notifications, coupons, user_coupons |

### Seed (Données de démonstration)

Peupler la base de données avec des données de test :

```bash
cd backend

# Exécuter le seed principal
npm run seed
```

**Données créées par le seed :**

| Table | Nb entrées | Détails |
|-------|-----------|---------|
| users | 10 | 1 admin, 1 demo, 3 marchands, 5 utilisateurs |
| wallet_accounts | 54 | 6 wallets × 9 utilisateurs (hors admin) |
| merchant_requests | 5 | 2 approuvés, 2 en attente, 1 rejeté |
| kyc_verifications | 3 | 1 vérifié, 1 en attente, 1 rejeté |
| kyc_documents | 6 | 2 documents par vérification |
| transactions | 20 | P2P, dépôts, retraits, paiements |
| disputes | 2 | 1 ouvert, 1 résolu |
| audit_logs | 10 | Actions diverses |
| notifications | 21 | 18 utilisateurs + 3 admin |

### Génération Prisma (non utilisé)

Le dossier `backend/prisma/` contient un schéma Prisma, mais **l'application utilise directement mysql2/promise et Knex**. Prisma n'est pas nécessaire au fonctionnement.

---

## 8. Lancement

### Mode développement

#### Terminal 1 : Backend

```bash
cd backend
npm run dev
# Lance nodemon avec rechargement automatique
# Serveur sur http://localhost:5000
```

#### Terminal 2 : Frontend

```bash
cd frontend
npm run dev
# Serveur sur http://localhost:3000
```

#### Vérification

```bash
# Tester le backend
curl http://localhost:5000/api/health
# { "status": "OK", "timestamp": "..." }

# Ouvrir le frontend dans le navigateur
http://localhost:3000
```

### Mode production

#### Backend

```bash
cd backend
NODE_ENV=production npm run start
# ou
node src/app.js
```

**Vérifications en production :**
- `JWT_SECRET` ne doit pas contenir "change-this"
- `CORS_ORIGINS` doit être configuré
- Les logs sont écrits dans `error.log` et `combined.log`

#### Frontend

```bash
cd frontend
npm run build    # Build de production
npm run start    # Serveur Next.js standalone
```

---

## 9. Docker

Le projet inclut une configuration Docker complète pour le déploiement.

### Utilisation avec Docker Compose

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Supprimer les volumes (données)
docker-compose down -v
```

### Services Docker

| Service | Image | Port | Dépend de |
|---------|-------|------|-----------|
| `mysql` | mysql:8.0 | 3306 | - |
| `backend` | Dockerfile backend | 5000 | mysql (healthy) |
| `frontend` | Dockerfile frontend | 3000 | backend |

### Build individuel

```bash
# Backend
cd backend
docker build -t marjane-backend .
docker run -p 5000:5000 marjane-backend

# Frontend
cd frontend
docker build -t marjane-frontend .
docker run -p 3000:3000 marjane-frontend
```

---

## 10. Comptes de démonstration

Après avoir exécuté `npm run seed`, les comptes suivants sont disponibles :

| Rôle | Email | Mot de passe | Code MFA |
|------|-------|-------------|----------|
| **Utilisateur** | `demo@marjane.ma` | `marjane2026` | `123456` |
| **Administrateur** | `admin@marjane.ma` | `admin123` | `123456` |
| Utilisateur | `youssef@marjane.ma` | `marjane2026` | `123456` |
| Utilisateur | `fatima@marjane.ma` | `marjane2026` | `123456` |
| Marchand | `karim@marjane.ma` | `marjane2026` | `123456` |
| Utilisateur | `nadia@marjane.ma` | `marjane2026` | `123456` |
| Marchand | `hassan@marjane.ma` | `marjane2026` | `123456` |
| Suspendu | `amina@marjane.ma` | `marjane2026` | `123456` |
| Utilisateur | `mehdi@marjane.ma` | `marjane2026` | `123456` |
| Marchand | `sara@marjane.ma` | `marjane2026` | `123456` |

> **Note :** En développement, les codes MFA et de vérification sont affichés dans la console du serveur backend.

---

## 11. Réinitialisation de la base de données

Si les tables existent déjà et que vous voulez repartir de zéro :

```bash
# Option 1 : Rollback + migration + seed
cd backend
npm run reset-db

# Option 2 : Supprimer et recréer manuellement
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root' });
  await c.query('DROP DATABASE IF EXISTS marjane_wallet');
  await c.query('CREATE DATABASE marjane_wallet');
  await c.end();
  console.log('Database recreated');
})();
"
npm run migrate
npm run seed
```

---

## 12. Déploiement

### Structure de déploiement recommandée

```
/var/www/marjane-wallet/
├── backend/
│   ├── src/
│   ├── node_modules/
│   ├── .env.production
│   └── package.json
├── frontend/
│   ├── .next/
│   ├── node_modules/
│   ├── .env.local
│   └── package.json
└── docker-compose.yml
```

### Points d'attention en production

1. **Variables d'environnement** : Utiliser `.env.production` pour le backend
2. **JWT_SECRET** : Générer une chaîne aléatoire de 64+ caractères
3. **HTTPS** : Configurer un reverse proxy (NGINX, Caddy) avec SSL
4. **MySQL** : Utiliser un utilisateur dédié (pas root) avec mot de passe fort
5. **Logs** : Vérifier que les fichiers de log sont accessibles (error.log, combined.log)
6. **Uploads** : Le dossier `backend/uploads/` doit être persistant
7. **Backup** : Mettre en place des sauvegardes régulières de la base de données

---

## 13. Vérification

### Backend

```bash
# Vérifier la syntaxe du code
cd backend
node --check src/app.js

# Vérifier que le serveur démarre
timeout 5 npm run start || true
# Devrait afficher : "Server running on port 5000"
```

### Frontend

```bash
# Vérifier le build
cd frontend
npm run build
# Devrait se terminer sans erreur
```

### API

```bash
# Santé du serveur
curl http://localhost:5000/api/health

# Taux de change
curl http://localhost:5000/api/exchange/rates

# Connexion (attends 401 si pas de token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@marjane.ma","password":"marjane2026"}'
```

### Base de données

```bash
# Voir les tables créées
mysql -u root marjane_wallet -e "SHOW TABLES;"

# Compter les utilisateurs
mysql -u root marjane_wallet -e "SELECT COUNT(*) as total_users FROM users;"

# Voir les migrations exécutées
cd backend
npx knex migrate:status
```

---

## 14. Dépannage

### Erreurs courantes et solutions

#### 1. `ER_ACCESS_DENIED_ERROR` — Accès MySQL refusé

**Problème :** Les identifiants MySQL sont incorrects.

**Solution :**
```bash
# Vérifier le fichier .env.development
cat backend/.env.development
# DATABASE_URL doit être : mysql://user:password@host:port/database

# Test manuel
mysql -u root -p
```

#### 2. `ECONNREFUSED` — Connexion MySQL refusée

**Problème :** MySQL n'est pas en cours d'exécution.

**Solution :**
```bash
# Windows (vérifier le service)
net start MySQL80

# macOS
brew services start mysql@8.0

# Linux
sudo systemctl start mysql
```

#### 3. `JWT_SECRET contains 'change-this'` — Secret faible en production

**Problème :** Le JWT_SECRET contient encore la valeur par défaut.

**Solution :** Modifier `.env.production` :
```env
JWT_SECRET=votre-nouvelle-cle-tres-longue-et-aleatoire-64-caracteres-minimum
JWT_REFRESH_SECRET=une-autre-cle-tout-aussi-longue-et-aleatoire
```

#### 4. `ERR_OSSL_EVP_UNSUPPORTED` — Erreur OpenSSL

**Problème :** Version de Node.js incompatible avec certaines dépendances.

**Solution :**
```bash
# Option 1 : Utiliser Node.js 18+
nvm use 18

# Option 2 : Définir une variable d'environnement
export NODE_OPTIONS=--openssl-legacy-provider
```

#### 5. `Module not found: Can't resolve 'encoding'` — Erreur Webpack

**Problème :** Dépendance manquante côté frontend.

**Solution :** Vérifier que `frontend/next.config.js` contient le polyfill :
```javascript
config.resolve.alias = {
  ...config.resolve.alias,
  'encoding': path.resolve(__dirname, 'src/polyfills/encoding.js'),
};
```

#### 6. Port déjà utilisé

**Problème :** Le port 3000 ou 5000 est déjà utilisé.

**Solution :**
```bash
# Vérifier les processus sur le port
netstat -ano | findstr :3000    # Windows
lsof -i :3000                   # macOS/Linux

# Tuer le processus (Windows)
taskkill /PID <PID> /F

# OU changer le port dans .env
PORT=5001
```

#### 7. `Knex: Timeout acquiring a connection` — Pool de connexions saturé

**Problème :** Trop de connexions MySQL simultanées.

**Solution :** Réduire le pool dans `backend/src/lib/db.js` :
```javascript
connectionLimit: 5  // au lieu de 10
```

#### 8. `Cannot stop, scanner is not running or paused` — Erreur QR scanner

**Problème :** Appel à `scanner.stop()` avant la fin de l'initialisation.

**Solution :** Mettre à jour le composant QRScanner (déjà corrigé dans le code) :
```typescript
if (started) {
  try { await scanner.stop(); } catch (e) { /* ignoré */ }
}
```

#### 9. Page admin vide après connexion

**Problème :** Le layout admin reste bloqué sur `checked = false`.

**Solution :** Vider le localStorage et réessayer :
```javascript
localStorage.removeItem("admin_token");
localStorage.removeItem("admin_refresh");
localStorage.removeItem("admin_user");
// Puis rafraîchir la page /admin/login
```

#### 10. `ER_DUP_ENTRY` — Doublon lors du seed

**Problème :** Le seed a déjà été exécuté.

**Solution :**
```bash
# Réinitialiser la base de données
npm run reset-db
```

---

## 15. Commandes utiles

```bash
# === BACKEND ===

# Démarrer le serveur (développement avec rechargement auto)
npm run dev

# Démarrer le serveur (production)
npm run start

# Exécuter les migrations
npm run migrate

# Revenir en arrière (rollback)
npm run migrate:rollback

# Exécuter le seed
npm run seed

# Réinitialiser la base de données complète
npm run reset-db

# Vérifier la syntaxe
node --check src/app.js

# Lancer les tests
npm test

# === FRONTEND ===

# Démarrer le serveur de développement
npm run dev

# Builder pour la production
npm run build

# Démarrer le serveur de production
npm run start

# Vérifier le lint
npm run lint

# === DOCKER ===

# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# === BASE DE DONNÉES ===

# Lister les tables
mysql -u root marjane_wallet -e "SHOW TABLES;"

# Décrire une table
mysql -u root marjane_wallet -e "DESCRIBE users;"

# Voir les migrations
npx knex migrate:status
```

---

*Document généré le 26 juin 2026 — Projet Marjane Wallet PFE*
