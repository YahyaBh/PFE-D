# Captures d'Écran — Marjane Wallet

**Inventaire exhaustif des interfaces pour le Rapport de Stage (PFE EFET)**

---

## Pages publiques

### Figure 1 : Page d'accueil (Landing Page)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/page.tsx` |
| **URL** | `/` |
| **Description** | Page d'accueil avec hero section contenant le titre "Marjane Wallet", une description du service multi-devises, un appel à l'action "Get Started", la section "Why Marjane Wallet" (3 cartes : Multi-Currency, Secure by Design, Merchant Ready), la section des fonctionnalités, et un footer. Animations GSAP au défilement. |
| **Pourquoi cette capture** | Première impression de l'application, présente la marque et les fonctionnalités clés |
| **Chapitre** | Présentation, Interface Utilisateur |

### Figure 2 : Pied de page (Footer)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/ui/Footer.tsx` |
| **URL** | `/` (bas de page) |
| **Description** | Footer avec les colonnes : Product (Dashboard, Cards, Rewards, KYC), Company (About, Blog, Careers, Contact), Support (Help Center, Privacy, Terms), et les droits réservés. |
| **Pourquoi cette capture** | Complète la landing page, montre la navigation secondaire |
| **Chapitre** | Interface Utilisateur |

### Figure 3 : Barre de navigation (Navbar)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/ui/Navbar.tsx` |
| **URL** | `/` (en-tête) |
| **Description** | Barre de navigation avec le logo "MARJANE WALLET", lien "Features", boutons "Sign In" et "Get Started". Liens vers le portail marchand et l'administration. |
| **Pourquoi cette capture** | Navigation principale de l'application |
| **Chapitre** | Interface Utilisateur |

---

## Authentification

### Figure 4 : Connexion utilisateur

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/login/page.tsx` |
| **URL** | `/login` |
| **Description** | Formulaire de connexion avec champs email et mot de passe, bouton de visibilité du mot de passe, case "Remember me", lien "Forgot Password?", bouton de connexion avec icône d'authentification biométrique, inscription biométrique. Animations GSAP. Toast pour les erreurs. |
| **Pourquoi cette capture** | Point d'entrée principal pour les utilisateurs, montre le design glassmorphism |
| **Chapitre** | Authentification, Sécurité |

### Figure 5 : Inscription utilisateur

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/register/page.tsx` |
| **URL** | `/register` |
| **Description** | Formulaire d'inscription avec champs nom, email, téléphone, mot de passe, confirmation mot de passe. Crée automatiquement 6 portefeuilles après validation. Option de saisie du face descriptor. |
| **Pourquoi cette capture** | Montre le processus de création de compte et la génération des wallets |
| **Chapitre** | Authentification, Portefeuilles |

### Figure 6 : Validation MFA

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/mfa/page.tsx` |
| **URL** | `/mfa` |
| **Description** | Écran de saisie du code MFA à 6 chiffres. Champ de code avec option de renvoi. Design centré avec logo et titre "Two-Factor Authentication". |
| **Pourquoi cette capture** | Montre le flux de sécurité à deux facteurs |
| **Chapitre** | Sécurité, Authentification |

### Figure 7 : Mot de passe oublié

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/forgot-password/page.tsx` |
| **URL** | `/forgot-password` |
| **Description** | Formulaire de demande de réinitialisation de mot de passe avec champ email. Message de confirmation après envoi. |
| **Pourquoi cette capture** | Parcours de récupération de compte |
| **Chapitre** | Authentification |

### Figure 8 : Réinitialisation du mot de passe

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/reset-password/page.tsx` |
| **URL** | `/reset-password` |
| **Description** | Formulaire de saisie du nouveau mot de passe avec token de réinitialisation. |
| **Pourquoi cette capture** | Complète le flux de récupération |
| **Chapitre** | Authentification |

### Figure 9 : Vérification email/téléphone

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/verify/page.tsx` |
| **URL** | `/verify` |
| **Description** | Page de vérification du code email et/ou téléphone après inscription. Deux modes : vérification email et vérification téléphone. |
| **Pourquoi cette capture** | Montre le processus de double vérification |
| **Chapitre** | Authentification, Sécurité |

---

## Dashboard Utilisateur

### Figure 10 : Dashboard principal

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/dashboard/page.tsx` |
| **URL** | `/dashboard` |
| **Description** | Vue principale de l'utilisateur connecté. Affiche : nom et email, grille des 6 portefeuilles (MAD, EUR, USD, BTC, ETH, USDT) avec soldes, barre d'actions rapides (Transfer, Deposit, Withdraw, Convert, Scan QR, Request), transactions récentes, carte virtuelle MAD, notifications dropdown. Animations GSAP et ScrollTrigger. |
| **Pourquoi cette capture** | Interface centrale de l'application. Montre tous les éléments clés |
| **Chapitre** | Dashboard, Portefeuilles, Interface Utilisateur |

### Figure 11 : Carte virtuelle MAD

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/VirtualCard.tsx` |
| **URL** | `/dashboard` (section cartes) |
| **Description** | Carte bancaire virtuelle avec design glassmorphism. Affiche le type (VISA), le numéro masqué (**** **** **** 1234), le titulaire, la date d'expiration. |
| **Pourquoi cette capture** | Montre le produit carte virtuelle, élément visuel fort |
| **Chapitre** | Cartes Virtuelles |

### Figure 12 : Portefeuilles multi-devises

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/WalletCard.tsx` |
| **URL** | `/dashboard` (grille des wallets) |
| **Description** | Cartes individuelles pour chaque devise avec solde, devise (MAD, EUR, USD, BTC, ETH, USDT), et indicateur de statut (actif/en attente de régulation). Design glassmorphism. |
| **Pourquoi cette capture** | Montre la gestion multi-devises, élément central du projet |
| **Chapitre** | Portefeuilles, Fonctionnalités |

### Figure 13 : Modal de transfert

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/TransferModal.tsx` |
| **URL** | `/dashboard` (modal Transfer) |
| **Description** | Modal de transfert d'argent avec champ de recherche du destinataire (email/téléphone), sélection du montant, choix de la devise (dropdown), bouton de confirmation. |
| **Pourquoi cette capture** | Fonctionnalité principale de paiement P2P |
| **Chapitre** | Transactions, Paiements |

### Figure 14 : Modal de dépôt

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/DepositModal.tsx` |
| **URL** | `/dashboard` (modal Deposit) |
| **Description** | Modal de dépôt avec choix de la source (Bank Transfer, Credit Card, Crypto), sélection de devise (MAD, EUR, USD), saisie du montant, et indicateur des frais applicables. |
| **Pourquoi cette capture** | Montre les différentes méthodes d'approvisionnement |
| **Chapitre** | Paiements, Portefeuilles |

### Figure 15 : Modal de retrait

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/WithdrawModal.tsx` |
| **URL** | `/dashboard` (modal Withdraw) |
| **Description** | Modal de retrait avec choix de la devise, saisie du montant, sélection de la destination, affichage des frais (2% MAD, 2.5% EUR/USD, 0% crypto). |
| **Pourquoi cette capture** | Montre le processus de retrait et la structure de frais |
| **Chapitre** | Paiements |

### Figure 16 : Modal de conversion

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/ConvertModal.tsx` |
| **URL** | `/dashboard` (modal Convert) |
| **Description** | Modal de conversion de devises avec sélecteurs "De" et "Vers", saisie du montant, affichage du taux de change en direct, frais de conversion (1.5% vers MAD, 2.5% depuis MAD). |
| **Pourquoi cette capture** | Montre la conversion multi-devises avec taux en temps réel |
| **Chapitre** | Taux de Change, Portefeuilles |

### Figure 17 : Modal de scan QR

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/QRScannerModal.tsx` |
| **URL** | `/dashboard` (modal QR Scanner) |
| **Description** | Modal avec le scanner QR intégré (html5-qrcode), vidéo caméra en direct, zone de décodage, et confirmation de paiement après scan. Design avec cache arrondie. |
| **Pourquoi cette capture** | Montre la fonctionnalité de paiement par QR code |
| **Chapitre** | Transactions QR |

### Figure 18 : Modal de demande d'argent

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/RequestModal.tsx` |
| **URL** | `/dashboard` (modal Request) |
| **Description** | Modal de demande d'argent avec recherche du destinataire, saisie du montant, note optionnelle. |
| **Pourquoi cette capture** | Montre la fonctionnalité de demande de paiement |
| **Chapitre** | Transactions |

### Figure 19 : Modal de détail de transaction

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/TransactionDetailModal.tsx` |
| **URL** | `/dashboard` (modal Transaction Detail) |
| **Description** | Modal avec détails complets d'une transaction : montant, devise, type, statut, date, expéditeur, destinataire, frais, note. |
| **Pourquoi cette capture** | Montre le niveau de détail des transactions |
| **Chapitre** | Transactions |

### Figure 20 : Modal de refill de carte

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/CardRefillModal.tsx` |
| **URL** | `/dashboard` (modal Card Refill) |
| **Description** | Modal de recharge de carte virtuelle avec sélection du wallet source (MAD, EUR, USD) et conversion automatique vers MAD (les cartes sont MAD-only). |
| **Pourquoi cette capture** | Montre le refill de carte multi-devises |
| **Chapitre** | Cartes Virtuelles |

### Figure 21 : Panneau de paramètres

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Wallet/SettingsPanel.tsx` |
| **URL** | `/dashboard` (settings panel) |
| **Description** | Panneau latéral ou modal avec les paramètres du wallet : notification preferences, limites, sécurité. |
| **Pourquoi cette capture** | Montre les options de configuration |
| **Chapitre** | Paramètres |

### Figure 22 : Notifications temps réel

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/Notifications/NotificationTray.tsx` |
| **URL** | `/dashboard` (dropdown notifications) |
| **Description** | Dropdown de notifications avec icônes par type (TRANSACTION, SECURITY_ALERT, SYSTEM, DISPUTE, KYC_UPDATE), message, date relative, bouton "Mark All Read". Badge avec le nombre de notifications non lues. |
| **Pourquoi cette capture** | Montre le système de notifications SSE |
| **Chapitre** | Notifications |

---

## Pages Utilisateur

### Figure 23 : Transactions (page complète)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/transactions/page.tsx` |
| **URL** | `/transactions` |
| **Description** | Page complète d'historique avec tableau des transactions, filtres par type/statut, barre de recherche, pagination, tris par date/montant. |
| **Pourquoi cette capture** | Montre l'historique complet avec tous les filtres |
| **Chapitre** | Transactions |

### Figure 24 : Profil utilisateur

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/profile/page.tsx` |
| **URL** | `/profile` |
| **Description** | Page de profil avec informations personnelles (nom, email, téléphone), changement de mot de passe, gestion de sessions actives, 2FA, authentification faciale, préférences. |
| **Pourquoi cette capture** | Montre la gestion du compte utilisateur |
| **Chapitre** | Profil, Sécurité |

### Figure 25 : Cartes virtuelles

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/cards/page.tsx` |
| **URL** | `/cards` |
| **Description** | Page de gestion des cartes virtuelles avec liste des cartes, leurs statuts (ACTIVE/FROZEN), soldes, boutons d'action (Freeze/Unfreeze, Regenerate, Delete), et option d'émission d'une nouvelle carte. |
| **Pourquoi cette capture** | Montre la gestion complète des cartes virtuelles |
| **Chapitre** | Cartes Virtuelles |

### Figure 26 : Vérification KYC

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/kyc/page.tsx` |
| **URL** | `/kyc` |
| **Description** | Page de vérification d'identité avec statut actuel (UNVERIFIED/PENDING/VERIFIED/REJECTED), upload de documents (CIN recto/verso, selfie, justificatif de domicile), soumission. |
| **Pourquoi cette capture** | Montre le processus KYC complet |
| **Chapitre** | KYC, Sécurité |

### Figure 27 : Programme de fidélité

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/rewards/page.tsx` |
| **URL** | `/rewards` |
| **Description** | Page des récompenses avec niveau de fidélité actuel, points accumulés, barre de progression vers le niveau suivant, liste des coupons disponibles à échanger. |
| **Pourquoi cette capture** | Montre le programme de fidélité et les coupons |
| **Chapitre** | Fidélité |

### Figure 28 : Page de test notifications

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/test-notifications/page.tsx` |
| **URL** | `/test-notifications` |
| **Description** | Page de test pour les notifications SSE avec boutons pour envoyer différents types de notifications, affichage des événements SSE reçus en temps réel. |
| **Pourquoi cette capture** | Montre le système de notifications et de debug |
| **Chapitre** | Notifications |

---

## Portail Marchand

### Figure 29 : Connexion marchand

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/merchant/login/page.tsx` |
| **URL** | `/merchant/login` |
| **Description** | Page de connexion spécifique aux marchands avec formulaire email/mot de passe. Design distinct du portail utilisateur. |
| **Pourquoi cette capture** | Point d'entrée du portail marchand |
| **Chapitre** | Portail Marchand |

### Figure 30 : Inscription marchand

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/merchant/register/page.tsx` |
| **URL** | `/merchant/register` |
| **Description** | Page d'inscription marchand avec formulaire de demande d'onboarding (business name, type, documents). |
| **Pourquoi cette capture** | Montre le processus d'inscription marchand |
| **Chapitre** | Portail Marchand |

### Figure 31 : Dashboard marchand

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/merchant/dashboard/page.tsx` |
| **URL** | `/merchant/dashboard` |
| **Description** | Dashboard marchand avec statistiques : revenu total, nombre de transactions, commande moyenne, clients uniques. Graphique des ventes sur 30 jours (Recharts), liste des dernières ventes. |
| **Pourquoi cette capture** | Interface principale du marchand |
| **Chapitre** | Portail Marchand, Statistiques |

### Figure 32 : QR code marchand

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/merchant/qr/page.tsx` |
| **URL** | `/merchant/qr` |
| **Description** | Page de génération et affichage du QR code marchand. QR code statique contenant le merchantId, options de téléchargement, génération de QR personnalisés. |
| **Pourquoi cette capture** | Montre le QR code marchand, élément clé des paiements |
| **Chapitre** | Transactions QR |

### Figure 33 : Historique marchand

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/merchant/history/page.tsx` |
| **URL** | `/merchant/history` |
| **Description** | Historique des transactions marchandes avec tableau, filtres, pagination. Montre les paiements reçus par QR code. |
| **Pourquoi cette capture** | Montre le suivi des ventes |
| **Chapitre** | Portail Marchand, Transactions |

### Figure 34 : Règlements marchands

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/merchant/settlements/page.tsx` |
| **URL** | `/merchant/settlements` |
| **Description** | Page des demandes de règlement avec historique, statuts (PENDING/COMPLETED), montants, et possibilité de faire une nouvelle demande. |
| **Pourquoi cette capture** | Montre le processus de règlement des fonds marchands |
| **Chapitre** | Portail Marchand |

### Figure 35 : Onboarding marchand

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/merchant/onboarding/page.tsx` |
| **URL** | `/merchant/onboarding` |
| **Description** | Formulaire d'onboarding marchand avec champs : nom d'entreprise, type d'activité, numéro RC, ICE, IF, documents. |
| **Pourquoi cette capture** | Montre le processus complet de demande marchande |
| **Chapitre** | Portail Marchand |

---

## Administration

### Figure 36 : Connexion administrateur

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/admin/login/page.tsx` |
| **URL** | `/admin/login` |
| **Description** | Page de connexion dédiée aux administrateurs. Fond sombre avec grille, carte glassmorphism, logo "MARJANE PROTOCOL", titre "Admin Control Center", champs email/mot de passe avec icônes, case "Remember me", bouton "Sign In" bleu (#3b82f6), lien "Return to main site". |
| **Pourquoi cette capture** | Point d'entrée de l'interface administrateur |
| **Chapitre** | Administration |

### Figure 37 : Dashboard administrateur

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/admin/page.tsx` |
| **URL** | `/admin` |
| **Description** | Dashboard admin avec statistiques globales : total users, active users, suspended users, total transactions, total volume, today volume, pending KYC, pending merchants, open disputes. Graphique du volume journalier sur 30 jours. Liste des activités récentes (10 dernières entrées d'audit). Indicateur de santé du système. |
| **Pourquoi cette capture** | Vue d'ensemble de l'administration |
| **Chapitre** | Administration, Statistiques |

### Figure 38 : Gestion des utilisateurs (admin)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/admin/users/page.tsx` |
| **URL** | `/admin/users` |
| **Description** | Liste paginée des utilisateurs avec statut (Active/Suspended), rôle (User/Merchant/Admin), email, téléphone. Filtres par statut (All/Active/Suspended) et rôle (All/Users/Merchants/Admins). Barre de recherche. Modal de détail avec informations du compte, wallets, transactions récentes, statut KYC. Actions : Suspend/Activate, Reset MFA. |
| **Pourquoi cette capture** | Montre la gestion complète des utilisateurs |
| **Chapitre** | Administration |

### Figure 39 : Transactions (admin)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/admin/transactions/page.tsx` |
| **URL** | `/admin/transactions` |
| **Description** | Liste paginée de toutes les transactions avec filtres par type (P2P, DEPOSIT, WITHDRAWAL, PAYMENT, QR_PAYMENT) et statut (COMPLETED, PENDING, FAILED). Modal de détail avec informations complètes. Bouton "Reverse" pour annuler une transaction. |
| **Pourquoi cette capture** | Montre la supervision des transactions et l'annulation |
| **Chapitre** | Administration, Transactions |

### Figure 40 : Demandes marchandes (admin)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/admin/merchant-requests/page.tsx` |
| **URL** | `/admin/merchant-requests` |
| **Description** | Liste des demandes d'onboarding marchand avec pagination, filtres par statut (Pending/Approved/Rejected), barre de recherche. Actions d'approbation/rejet avec champ de raison optionnelle. |
| **Pourquoi cette capture** | Montre la gestion des commerçants |
| **Chapitre** | Administration, Portail Marchand |

### Figure 41 : Comptabilité générale (admin)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/admin/ledger/page.tsx` |
| **URL** | `/admin/ledger` |
| **Description** | Comptabilité à double entrée avec deux onglets : "Ledger Accounts" (liste des comptes avec soldes) et "Journal Entries" (écritures comptables). Bouton "Reconcile" pour vérifier l'intégrité (total crédits = total débits). Cartes statistiques : Total Credits, Total Debits, Imbalance. |
| **Pourquoi cette capture** | Montre le système de double comptabilité |
| **Chapitre** | Administration, Comptabilité |

### Figure 42 : Litiges (admin)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/admin/disputes/page.tsx` |
| **URL** | `/admin/disputes` |
| **Description** | Liste des litiges avec pagination, filtres par statut (Open/Resolved), barre de recherche. Vue détaillée avec messages entre l'utilisateur et l'admin, visualisation des preuves uploadées, actions de résolution. |
| **Pourquoi cette capture** | Montre la gestion des disputes |
| **Chapitre** | Administration, Litiges |

### Figure 43 : Vérifications KYC (admin)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/admin/kyc/page.tsx` |
| **URL** | `/admin/kyc` |
| **Description** | Liste des vérifications KYC avec statistiques (Verified, Pending, Rejected, Unverified), filtres par statut, pagination. Modal d'approbation/rejet avec vue des documents uploadés. |
| **Pourquoi cette capture** | Montre la gestion des vérifications d'identité |
| **Chapitre** | Administration, KYC |

### Figure 44 : Journal d'audit (admin)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/admin/audit/page.tsx` |
| **URL** | `/admin/audit` |
| **Description** | Journal d'audit avec liste chronologique des actions (USER_LOGIN, REGISTER, TRANSACTION_CREATED, KYC_SUBMITTED, etc.), utilisateur concerné, ressource, adresse IP, date. Pagination, recherche. |
| **Pourquoi cette capture** | Montre la traçabilité complète du système |
| **Chapitre** | Administration, Sécurité |

### Figure 45 : Diffusion de notifications (admin)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/app/admin/broadcast/page.tsx` |
| **URL** | `/admin/broadcast` |
| **Description** | Page de diffusion de notifications avec titre, message, niveau d'alerte (Info/Warning/Critical), audience cible (All Users/All Merchants/All). Cartes latérales avec les statistiques de notification. |
| **Pourquoi cette capture** | Montre la fonctionnalité de communication administrateur |
| **Chapitre** | Administration, Notifications |

---

## Composants Partagés

### Figure 46 : Authentification biométrique

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/FaceAuth.tsx` |
| **URL** | Utilisé dans `/login` et `/profile` |
| **Description** | Composant d'authentification faciale utilisant face-api.js. Capture vidéo, détection et comparaison de visages. |
| **Pourquoi cette capture** | Montre la fonctionnalité biométrique |
| **Chapitre** | Sécurité |

### Figure 47 : Overlay biométrique

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/BiometricOverlay.tsx` |
| **URL** | Utilisé dans `/login` |
| **Description** | Overlay de scanning biométrique avec animation, cercle de scan, message d'orientation. |
| **Pourquoi cette capture** | Montre l'interface de scan facial |
| **Chapitre** | Sécurité |

### Figure 48 : Graphique des ventes marchand

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/MerchantSalesChart.tsx` |
| **URL** | Utilisé dans `/merchant/dashboard` |
| **Description** | Graphique en barres ou courbes (Recharts) montrant les ventes des 30 derniers jours. |
| **Pourquoi cette capture** | Montre les analytics marchands |
| **Chapitre** | Statistiques, Portail Marchand |

### Figure 49 : Toast notifications

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/ui/Toast.tsx`, `ToastProvider.tsx` |
| **URL** | Utilisé dans toutes les pages |
| **Description** | Composant Toast pour les notifications temporaires (succès/erreur) avec animation d'entrée/sortie. |
| **Pourquoi cette capture** | Feedback utilisateur essentiel |
| **Chapitre** | Interface Utilisateur |

### Figure 50 : Barre de chargement

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/ui/LoadingBar.tsx` |
| **URL** | Utilisé dans toutes les pages |
| **Description** | Barre de progression horizontale pour les chargements de page et les requêtes API. |
| **Pourquoi cette capture** | Indicateur de chargement |
| **Chapitre** | Interface Utilisateur |

### Figure 51 : Modal de confirmation

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/ui/ConfirmModal.tsx` |
| **URL** | Utilisé dans diverses pages |
| **Description** | Modal de confirmation avec message, boutons Confirm/Annuler, design glassmorphism. |
| **Pourquoi cette capture** | Composant UI générique de confirmation |
| **Chapitre** | Interface Utilisateur |

### Figure 52 : Input téléphone

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/ui/PhoneInput.tsx` |
| **URL** | Utilisé dans `/register` |
| **Description** | Champ de saisie de numéro de téléphone avec indicatif pays (+212 pour le Maroc). |
| **Pourquoi cette capture** | Composant de saisie spécialisé |
| **Chapitre** | Interface Utilisateur |

### Figure 53 : Animations client

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/ui/ClientAnimations.tsx` |
| **URL** | Utilisé dans la landing page |
| **Description** | Composant d'animations GSAP pour les transitions de page et les éléments au défilement. |
| **Pourquoi cette capture** | Montre les animations de l'interface |
| **Chapitre** | Interface Utilisateur |

### Figure 54 : Thème (Provider)

| Champ | Détail |
|-------|--------|
| **Fichier** | `frontend/src/components/ThemeProvider.tsx` |
| **URL** | `layout.tsx` (wrapper global) |
| **Description** | Provider de thème avec mode sombre/clair, gestion des variables CSS personnalisées. |
| **Pourquoi cette capture** | Architecture du thème |
| **Chapitre** | Architecture |

---

## Récapitulatif

| # | Figure | Page | Chapitre |
|---|--------|------|----------|
| 1 | Page d'accueil | `/` | Présentation |
| 2 | Pied de page | `/` (footer) | Interface Utilisateur |
| 3 | Barre de navigation | `/` (navbar) | Interface Utilisateur |
| 4 | Connexion utilisateur | `/login` | Authentification |
| 5 | Inscription | `/register` | Authentification |
| 6 | Validation MFA | `/mfa` | Sécurité |
| 7 | Mot de passe oublié | `/forgot-password` | Authentification |
| 8 | Réinitialisation mot de passe | `/reset-password` | Authentification |
| 9 | Vérification email/téléphone | `/verify` | Authentification |
| 10 | Dashboard utilisateur | `/dashboard` | Dashboard |
| 11 | Carte virtuelle | Dashboard | Cartes |
| 12 | Portefeuilles multi-devises | Dashboard | Portefeuilles |
| 13 | Modal transfert | Dashboard | Transactions |
| 14 | Modal dépôt | Dashboard | Paiements |
| 15 | Modal retrait | Dashboard | Paiements |
| 16 | Modal conversion | Dashboard | Taux de Change |
| 17 | Modal scan QR | Dashboard | Transactions QR |
| 18 | Modal demande d'argent | Dashboard | Transactions |
| 19 | Modal détail transaction | Dashboard | Transactions |
| 20 | Modal refill carte | Dashboard | Cartes |
| 21 | Panneau paramètres | Dashboard | Paramètres |
| 22 | Notifications temps réel | Dashboard | Notifications |
| 23 | Transactions | `/transactions` | Transactions |
| 24 | Profil | `/profile` | Profil |
| 25 | Cartes | `/cards` | Cartes |
| 26 | KYC | `/kyc` | KYC |
| 27 | Récompenses | `/rewards` | Fidélité |
| 28 | Test notifications | `/test-notifications` | Notifications |
| 29 | Connexion marchand | `/merchant/login` | Portail Marchand |
| 30 | Inscription marchand | `/merchant/register` | Portail Marchand |
| 31 | Dashboard marchand | `/merchant/dashboard` | Portail Marchand |
| 32 | QR marchand | `/merchant/qr` | Transactions QR |
| 33 | Historique marchand | `/merchant/history` | Portail Marchand |
| 34 | Règlements marchands | `/merchant/settlements` | Portail Marchand |
| 35 | Onboarding marchand | `/merchant/onboarding` | Portail Marchand |
| 36 | Connexion admin | `/admin/login` | Administration |
| 37 | Dashboard admin | `/admin` | Administration |
| 38 | Utilisateurs (admin) | `/admin/users` | Administration |
| 39 | Transactions (admin) | `/admin/transactions` | Administration |
| 40 | Demandes marchandes (admin) | `/admin/merchant-requests` | Administration |
| 41 | Comptabilité (admin) | `/admin/ledger` | Administration |
| 42 | Litiges (admin) | `/admin/disputes` | Administration |
| 43 | KYC (admin) | `/admin/kyc` | Administration |
| 44 | Journal d'audit (admin) | `/admin/audit` | Administration |
| 45 | Diffusion (admin) | `/admin/broadcast` | Administration |
| 46 | Authentification faciale | Composant FaceAuth | Sécurité |
| 47 | Overlay biométrique | Composant BiometricOverlay | Sécurité |
| 48 | Graphique ventes | Composant MerchantSalesChart | Statistiques |
| 49 | Toast | Composant Toast | Interface |
| 50 | Barre de chargement | Composant LoadingBar | Interface |
| 51 | Modal confirmation | Composant ConfirmModal | Interface |
| 52 | Input téléphone | Composant PhoneInput | Interface |
| 53 | Animations | Composant ClientAnimations | Interface |
| 54 | Provider thème | Composant ThemeProvider | Architecture |

---

**Total : 54 captures d'écran** couvrant l'intégralité de l'application.

---

*Document généré le 26 juin 2026 — Projet Marjane Wallet PFE*
