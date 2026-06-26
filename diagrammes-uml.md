# Diagrammes UML — Marjane Wallet

**Projet de Fin d'Études (PFE) — EFET**

---

## Table des matières

1. [Diagramme de cas d'utilisation](#1-diagramme-de-cas-dutilisation)
2. [Diagramme de classes](#2-diagramme-de-classes)
3. [Diagramme de séquence — Authentification](#3-diagramme-de-séquence--authentification)
4. [Diagramme de séquence — Paiement P2P](#4-diagramme-de-séquence--paiement-p2p)
5. [Diagramme de séquence — Paiement QR](#5-diagramme-de-séquence--paiement-qr)
6. [Diagramme de séquence — Paiement Crypto](#6-diagramme-de-séquence--paiement-crypto)
7. [Diagramme d'activités](#7-diagramme-dactivités)
8. [Diagramme de composants](#8-diagramme-de-composants)
9. [Diagramme de déploiement](#9-diagramme-de-déploiement)
10. [Diagramme de packages](#10-diagramme-de-packages)
11. [Diagramme de communication](#11-diagramme-de-communication)
12. [Diagramme d'états](#12-diagramme-détats)

---

## 1. Diagramme de cas d'utilisation

### Description

Ce diagramme représente les interactions entre les acteurs du système (Utilisateur, Marchand, Administrateur) et les fonctionnalités offertes par l'application Marjane Wallet. Chaque acteur possède un ensemble de cas d'utilisation correspondant à ses droits d'accès.

**Acteurs identifiés :**
- **Utilisateur** : Personne inscrite sur la plateforme pouvant gérer ses portefeuilles
- **Marchand** : Commerçant disposant d'un portefeuille marchand pour accepter les paiements
- **Administrateur** : Gestionnaire du système avec accès à toutes les fonctionnalités d'administration

### Code PlantUML

```plantuml
@startuml
left to right direction

actor "Utilisateur" as User
actor "Marchand" as Merchant
actor "Administrateur" as Admin

rectangle "Marjane Wallet" {
  !define UserUsecases [
  usecase "UC01 - S'inscrire" as UC1
  usecase "UC02 - Se connecter" as UC2
  usecase "UC03 - Gérer ses portefeuilles\n(MAD, EUR, USD, BTC, ETH, USDT)" as UC3
  usecase "UC04 - Effectuer un transfert\nP2P" as UC4
  usecase "UC05 - Déposer des fonds" as UC5
  usecase "UC06 - Retirer des fonds" as UC6
  usecase "UC07 - Convertir des devises" as UC7
  usecase "UC08 - Payer par QR code" as UC8
  usecase "UC09 - Demander de l'argent" as UC9
  usecase "UC10 - Gérer ses cartes\nvirtuelles" as UC10
  usecase "UC11 - Vérifier son identité\n(KYC)" as UC11
  usecase "UC12 - Consulter l'historique\ndes transactions" as UC12
  usecase "UC13 - Voir les notifications" as UC13
  usecase "UC14 - Gérer son profil" as UC14
  usecase "UC15 - Participer au programme\nde fidélité" as UC15
  ]

  usecase "UC16 - Gérer son portail\nmarchand" as UC16
  usecase "UC17 - Demander l'onboarding" as UC17
  usecase "UC18 - Générer des QR codes" as UC18
  usecase "UC19 - Demander un règlement\n(settlement)" as UC19
  usecase "UC20 - Voir les statistiques\nde ventes" as UC20

  usecase "UC21 - Se connecter en tant\nqu'admin" as UC21
  usecase "UC22 - Gérer les utilisateurs" as UC22
  usecase "UC23 - Superviser les\ntransactions" as UC23
  usecase "UC24 - Gérer les demandes\nmarchandes" as UC24
  usecase "UC25 - Gérer les\nvérifications KYC" as UC25
  usecase "UC26 - Gérer les litiges" as UC26
  usecase "UC27 - Diffuser des\nnotifications" as UC27
  usecase "UC28 - Consulter le journal\nd'audit" as UC28
  usecase "UC29 - Gérer la comptabilité\n(ledger)" as UC29
}

User --> UC1
User --> UC2
User --> UC3
User --> UC4
User --> UC5
User --> UC6
User --> UC7
User --> UC8
User --> UC9
User --> UC10
User --> UC11
User --> UC12
User --> UC13
User --> UC14
User --> UC15

Merchant --> UC16
Merchant --> UC17
Merchant --> UC18
Merchant --> UC19
Merchant --> UC20
Merchant --> UC2
Merchant --> UC12
Merchant --> UC13

Admin --> UC21
Admin --> UC22
Admin --> UC23
Admin --> UC24
Admin --> UC25
Admin --> UC26
Admin --> UC27
Admin --> UC28
Admin --> UC29

UC16 ..> UC17 : <<include>>
UC16 ..> UC20 : <<include>>

@enduml
```

### Description détaillée

| Code | Cas d'utilisation | Acteur | Description |
|------|-------------------|--------|-------------|
| UC01 | S'inscrire | Utilisateur | Création de compte avec email, mot de passe, nom, téléphone. Création automatique de 6 portefeuilles. |
| UC02 | Se connecter | Utilisateur, Marchand | Authentification avec email/mot de passe + validation MFA |
| UC03 | Gérer portefeuilles | Utilisateur | Consultation des soldes des 6 comptes, activation/désactivation |
| UC04 | Transfert P2P | Utilisateur | Envoi d'argent à un autre utilisateur avec frais variables |
| UC08 | Payer par QR | Utilisateur | Scan d'un QR code marchand ou utilisateur pour payer |
| UC16 | Portail marchand | Marchand | Accès au dashboard, statistiques, QR codes, règlements |
| UC22 | Gérer utilisateurs | Admin | Liste, suspension, activation, réinitialisation MFA |
| UC23 | Superviser transactions | Admin | Consultation, filtrage, annulation de transactions |
| UC24 | Gérer demandes marchandes | Admin | Approbation/rejet des demandes d'onboarding |
| UC29 | Gérer comptabilité | Admin | Consultation du ledger, réconciliation des comptes |

---

## 2. Diagramme de classes

### Description

Ce diagramme présente les principales entités du domaine et leurs relations. Il est basé sur le schéma de base de données MySQL et les modèles métier utilisés dans l'application.

### Code PlantUML

```plantuml
@startuml
!theme plain

class User {
  - id: UUID
  - email: String
  - password: String (hashé)
  - name: String
  - phone: String
  - role: String {ROLE_USER, ROLE_MERCHANT, ROLE_ADMIN}
  - status: String {active, suspended}
  - tier: String {FREE, BRONZE, SILVER, GOLD, PLATINUM}
  - kyc_status: String
  - loyalty_points: Integer
  - is_email_verified: Boolean
  - is_phone_verified: Boolean
  - face_descriptor: JSON
  - mfa_code: String
  - mfa_expires: Timestamp
  +register()
  +login()
  +verifyMFA()
}

class WalletAccount {
  - id: UUID
  - balance: Decimal
  - currency: String {MAD, EUR, USD, BTC, ETH, USDT}
  - type: String {fiat, crypto, merchant}
  - status: String {active, pending_regulation}
  - label: String
  +deposit(amount)
  +withdraw(amount)
  +getBalance()
}

class Transaction {
  - id: UUID
  - amount: Decimal
  - currency: String
  - type: String {P2P, DEPOSIT, WITHDRAWAL, QR_PAYMENT, REQUEST, PAYMENT}
  - status: String {PENDING, COMPLETED, FAILED}
  - fee: Decimal
  - note: String
  +execute()
  +reverse()
}

class Card {
  - id: UUID
  - card_number: String
  - card_holder: String
  - expiry_date: String
  - cvv: String
  - status: String {ACTIVE, FROZEN}
  - balance: Decimal
  +issue()
  +freeze()
  +regenerate()
  +refill(amount)
}

class LedgerEntry {
  - id: UUID
  - amount: Decimal
  - description: String
}

class LedgerAccount {
  - id: UUID
  - name: String
  - type: String {ASSET, LIABILITY, REVENUE}
  - balance: Decimal
  - currency: String
}

class Merchant {
  - id: UUID
  - business_name: String
  - business_type: String
  - status: String {PENDING_APPROVAL, active, suspended}
  - rc_number: String
  - ice_number: String
  - tax_id: String
}

class MerchantWallet {
  - id: UUID
  - balance: Decimal
  - currency: String
}

class Settlement {
  - id: UUID
  - amount: Decimal
  - currency: String
  - status: String {PENDING, COMPLETED}
}

class Notification {
  - id: UUID
  - type: String
  - title: String
  - message: String
  - is_read: Boolean
  - level: String {info, warning, critical}
  - target: String {all, users, merchants}
}

class KYCVerification {
  - id: UUID
  - status: String {UNVERIFIED, PENDING, VERIFIED, REJECTED}
  - risk_score: Integer
  +submit()
  +approve()
  +reject()
}

class KYCDocument {
  - id: UUID
  - type: String {CIN_RECTO, CIN_VERSO, SELFIE, ADDRESS_PROOF}
  - file_path: String
  - file_name: String
}

class Dispute {
  - id: UUID
  - reason: String
  - description: String
  - status: String {OPEN, RESOLVED}
  - resolution_note: String
}

class AuditLog {
  - id: UUID
  - action: String
  - resource: String
  - resource_id: String
  - details: JSON
  - ip_address: String
}

class DeviceSession {
  - id: UUID
  - device: String
  - ip: String
  - last_login: Timestamp
}

class ExchangeRate {
  - id: UUID
  - base_currency: String
  - target_currency: String
  - rate: Decimal
}

class RefreshToken {
  - id: UUID
  - token_hash: String
  - expires_at: Timestamp
  - device_info: String
}

User "1" -- "0..6" WalletAccount : possède
User "1" -- "0..*" Transaction : initie
User "1" -- "0..*" Card : possède
User "1" -- "0..*" DeviceSession : a
User "1" -- "0..*" RefreshToken : a
User "1" -- "0..*" Notification : reçoit
User "1" -- "0..*" AuditLog : génère
User "1" -- "0..1" KYCVerification : soumet
User "1" -- "0..*" Dispute : ouvre
User "1" -- "0..1" Merchant : gère

Merchant "1" -- "1" MerchantWallet : possède
Merchant "1" -- "0..*" Settlement : demande
Merchant "1" -- "0..*" Transaction : reçoit

KYCVerification "1" -- "0..*" KYCDocument : contient
WalletAccount "0..*" -- "0..*" Transaction : participe
Transaction "1" -- "2" LedgerEntry : enregistre
LedgerEntry "0..*" -- "1" LedgerAccount : référence

@enduml
```

### Description détaillée

| Classe | Rôle | Attributs clés | Associations |
|--------|------|----------------|--------------|
| **User** | Entité centrale représentant un utilisateur | id, email, password (hashé), role, status, tier | Possède 6 WalletAccount, initie des Transaction |
| **WalletAccount** | Portefeuille d'une devise spécifique | id, balance, currency, type, status | Lié à un User via user_id |
| **Transaction** | Opération financière entre deux wallets | id, amount, type, status, fee | Lien vers sender_wallet et receiver_wallet |
| **Card** | Carte virtuelle MAD | card_number, expiry_date, cvv, status | Lié à un User et optionnellement un WalletAccount |
| **Merchant** | Compte marchand | business_name, business_type, status, rc, ice | Géré par un User, possède un MerchantWallet |
| **LedgerEntry** | Écriture comptable double entrée | amount, description | Associé à une Transaction et un LedgerAccount |
| **Notification** | Message utilisateur ou système | type, title, message, is_read, level, target | Envoyée à un User |
| **KYCVerification** | Processus de vérification d'identité | status, risk_score | Soumis par un User, contient des KYCDocument |
| **Dispute** | Litige sur une transaction | reason, description, status | Ouvert par un User, lié à une Transaction |

---

## 3. Diagramme de séquence — Authentification

### Description

Ce diagramme illustre le flux complet d'authentification d'un utilisateur, depuis la soumission du formulaire de connexion jusqu'à l'obtention des jetons JWT après validation du code MFA.

### Code PlantUML

```plantuml
@startuml
actor "Utilisateur" as User
participant "Frontend\n(Next.js)" as Frontend
participant "API\n(Express)" as API
participant "Middleware\nauth.js" as Auth
participant "authController" as Controller
database "MySQL\nDatabase" as DB

== Étape 1 : Connexion initiale ==

User -> Frontend: Saisit email + password
Frontend -> API: POST /auth/login\n{email, password}
note right: Rate limit : 10 req/30 min

API -> Controller: login()
Controller -> DB: SELECT * FROM users\nWHERE email = ?
DB --> Controller: user data
Controller -> Controller: bcrypt.compare(password, user.password)

alt Mot de passe incorrect
  Controller -> DB: INSERT INTO audit_logs\n(LOGIN_FAILED)
  Controller --> Frontend: 401 { error: "Invalid credentials" }
  Frontend --> User: Message d'erreur
else Mot de passe correct
  Controller -> Controller: generateCode() → 6 chiffres
  Controller -> DB: UPDATE users SET\nmfa_code = ?, mfa_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR)
  Controller -> Controller: emailService.sendMFACode()
  Controller --> Frontend: { requireMFA: true, userId }
  Frontend --> User: Affiche formulaire MFA
end

== Étape 2 : Validation MFA ==

User -> Frontend: Saisit code MFA (6 chiffres)
Frontend -> API: POST /auth/verify-mfa\n{userId, code}

API -> Controller: verifyMFA()
Controller -> DB: SELECT * FROM users WHERE id = ?
Controller -> DB: SELECT NOW() > mfa_expires AS isExpired

alt Code expiré
  Controller --> Frontend: 400 { error: "MFA code expired" }
  Frontend --> User: Demande de renvoi de code
else Code invalide
  Controller --> Frontend: 400 { error: "Invalid MFA code" }
  Frontend --> User: Erreur code incorrect
else Code valide
  Controller -> DB: UPDATE users SET\nmfa_code = NULL, mfa_expires = NULL
  
  Controller -> Controller: jwt.sign({ id }, SECRET, { expiresIn: '15m' })
  Controller -> Controller: uuid() → refreshToken
  Controller -> Controller: bcrypt.hash(refreshToken)
  Controller -> DB: INSERT INTO refresh_tokens\n(id, user_id, token_hash, expires_at, device_info)
  Controller -> DB: INSERT INTO audit_logs\n(LOGIN_SUCCESS)
  
  Controller --> Frontend: { accessToken, refreshToken, role }
  Frontend -> Frontend: localStorage.setItem("token", accessToken)
  Frontend -> Frontend: localStorage.setItem("refreshToken", refreshToken)
  Frontend --> User: Redirection vers Dashboard
end

== Étape 3 : Requête authentifiée ==

User -> Frontend: Navigation
Frontend -> API: GET /api/wallet/accounts\nAuthorization: Bearer <token>

API -> Auth: authMiddleware()
Auth -> Auth: jwt.verify(token, JWT_SECRET)
Auth -> DB: SELECT id, name, email, role, status\nFROM users WHERE id = ?
DB --> Auth: user data

alt Utilisateur suspendu
  Auth --> Frontend: 403 { error: "Account suspended" }
  Frontend --> User: Redirection vers login
else Token expiré
  Auth --> Frontend: 401 { error: "Session expired" }
  Frontend -> Frontend: handleTokenRefresh()
  Frontend -> API: POST /auth/refresh\n{refreshToken}
  Controller -> DB: SELECT * FROM refresh_tokens\nWHERE expires_at > NOW()
  Controller -> Controller: bcrypt.compare(refreshToken, hash)
  Controller -> DB: DELETE FROM refresh_tokens\nWHERE id = ? (rotation)
  Controller -> Controller: Nouveaux tokens
  Controller --> Frontend: { newAccessToken, newRefreshToken }
  Frontend -> Frontend: localStorage.setItem()
  Frontend -> API: Retry avec nouveau token
else Token valide
  Auth --> Controller: req.user = userData
  Controller -> DB: Requête protégée
  DB --> Controller: data
  Controller --> Frontend: { wallets, transactions, ... }
  Frontend --> User: Affichage du Dashboard
end

@enduml
```

### Flux détaillé

| Étape | Action | Données échangées |
|-------|--------|-------------------|
| 1. Login | Client → API | `{ email, password }` |
| 1.1 | Vérification bcrypt | Comparaison du hash |
| 1.2 | Génération MFA | Code 6 chiffres, stocké avec expiration |
| 1.3 | Réponse | `{ requireMFA: true, userId }` |
| 2. Vérification MFA | Client → API | `{ userId, code }` |
| 2.1 | Vérification expiration | `SELECT NOW() > mfa_expires` |
| 2.2 | Vérification code | Comparaison exacte (case-insensitive) |
| 2.3 | Génération tokens | JWT 15min + refresh 30 jours |
| 2.4 | Réponse | `{ accessToken, refreshToken, role }` |
| 3. Requête protégée | Header | `Authorization: Bearer <JWT>` |
| 3.1 | Vérification JWT | jwt.verify + SELECT user |
| 3.2 | Refresh si 401 | Rotation avec bcrypt.compare sur tous les tokens |

---

## 4. Diagramme de séquence — Paiement P2P

### Description

Ce diagramme détaille le flux complet d'un transfert d'argent entre deux utilisateurs, incluant la validation, le calcul des frais, la double comptabilité et les notifications.

### Code PlantUML

```plantuml
@startuml
actor "Expéditeur" as Sender
actor "Destinataire" as Receiver
participant "Frontend" as Frontend
participant "API" as API
participant "transferController" as Controller
participant "transferService" as Service
participant "ledgerService" as Ledger
database "MySQL" as DB

Sender -> Frontend: Ouvre TransferModal
Frontend -> Frontend: Recherche destinataire\nGET /transactions/search?query=

Frontend -> API: GET /transactions/search?query=
API -> DB: SELECT id, name, email, phone\nFROM users WHERE email = ? OR phone = ?
DB --> API: { id, name, email }
API --> Frontend: User trouvé

Sender -> Frontend: Saisit montant + devise
Frontend -> API: POST /transactions/transfer\n{ receiverId, amount, currency }
note right: Headers:\nAuthorization: Bearer\nIdempotency-Key: UUID

API -> API: idempotency.js\nVérification clé d'idempotence

alt Clé déjà utilisée
  API --> Frontend: { cachedResponse } (200)
else Nouvelle requête
  API -> Controller: handleTransfer()
  Controller -> Service: executeTransfer(senderId, receiverId, amount, currency)
  
  Service -> DB: SELECT balance, id FROM wallet_accounts\nWHERE user_id = ? AND currency = ? FOR UPDATE
  note right: FOR UPDATE = verrouillage ligne
  
  alt Solde insuffisant
    Service --> Controller: throw Error("Insufficient balance")
    Controller --> Frontend: 400 { error: "Insufficient balance" }
    Frontend --> Sender: Message d'erreur
  else Solde suffisant
    Service -> Service: Calcul des frais
    note right: Même devise → 0%\nCross-devise → 2.5%
    
    Service -> DB: START TRANSACTION
    Service -> DB: UPDATE wallet_accounts SET\nbalance = balance - (amount + fee)\nWHERE id = senderWallet
    Service -> DB: UPDATE wallet_accounts SET\nbalance = balance + amount\nWHERE id = receiverWallet
    
    Service -> DB: INSERT INTO transactions\n(id, sender, receiver, amount, currency, type='P2P', status='COMPLETED', fee)
    
    Service -> Ledger: recordTransaction(connection, transactionId, entries)
    Ledger -> DB: INSERT INTO ledger_entries\n(account: sender, amount: -amount)
    Ledger -> DB: INSERT INTO ledger_entries\n(account: receiver, amount: +amount)
    
    Service -> DB: UPDATE users SET\nloyalty_points = loyalty_points + ?\nWHERE id = senderId
    note right: 1 point = 100 MAD
    
    Service -> DB: COMMIT
    
    Service -> Service: notificationController.createNotification()
    Service -> DB: INSERT INTO notifications\n(senderId, 'TRANSACTION', 'Paiement envoyé')
    Service -> DB: INSERT INTO notifications\n(receiverId, 'TRANSACTION', 'Paiement reçu')
    
    Service -> DB: INSERT INTO audit_logs\n(user_id, 'TRANSFER_SENT', ...)
    
    Service --> Controller: { transactionId, fee, amount }
    Controller --> Frontend: { message: "Transfer successful", transactionId, fee }
    Frontend --> Sender: Confirmation visuelle
    
    Frontend --> Receiver: Notification en temps réel (SSE)
  end
end

@enduml
```

### Calcul des frais détaillé

| Condition | Frais | Exemple (1000 MAD) |
|-----------|-------|--------------------|
| Même devise (MAD→MAD) | 0% | 0 MAD |
| Cross-devise (MAD→EUR) | 2,5% | 25 MAD |
| Dépôt bancaire | 1% | 10 MAD |
| Dépôt carte | 1,5% | 15 MAD |
| Retrait MAD | 2% | 20 MAD |

---

## 5. Diagramme de séquence — Paiement QR

### Description

Ce diagramme illustre le flux de paiement par QR code, depuis l'ouverture du scanner jusqu'à la confirmation du paiement, en passant par le décodage du QR et l'exécution de la transaction.

### Code PlantUML

```plantuml
@startuml
actor "Client" as Client
actor "Marchand" as Merchant
participant "Frontend" as Frontend
participant "html5-qrcode\nlibrary" as QR
participant "API" as API
participant "transactionController" as Controller
participant "ledgerService" as Ledger
database "MySQL" as DB

== Phase 1 : Le marchand génère son QR code ==

Merchant -> Frontend: Accède au portail marchand
Frontend -> API: GET /merchant/qr
note right: Headers: Authorization: Bearer (merchant token)

API -> DB: SELECT * FROM merchant_wallets\nWHERE merchant_id = ?
API -> DB: SELECT * FROM merchants\nWHERE id = ?
DB --> API: merchant data + wallet

API --> Frontend: { merchantId, businessName, walletId }
Frontend -> Frontend: qrcode.react génère QR code
Frontend --> Merchant: QR code affiché

== Phase 2 : Le client scanne le QR code ==

Client -> Frontend: Ouvre QRScannerModal
Frontend -> Frontend: Initialise html5-qrcode

Frontend -> QR: scanner.start(camera, callback)
QR --> Frontend: Flux vidéo (caméra)

Client -> Client: Pointe la caméra vers le QR
QR --> Frontend: QR code décodé → merchantId

Frontend -> Frontend: Ferme le scanner
Frontend --> Client: Affiche les détails :\n"Paiement à [Marchand] - Montant ?"

Client -> Frontend: Saisit le montant et confirme

Frontend -> API: POST /transactions/qr-payment\n{ merchantId, amount, description }

API -> Controller: processQRPayment()

Controller -> DB: START TRANSACTION
Controller -> DB: SELECT id, balance FROM wallet_accounts\nWHERE user_id = ? AND currency = 'MAD' FOR UPDATE

alt Solde insuffisant
  Controller -> DB: ROLLBACK
  Controller --> Frontend: 400 { error: "Insufficient balance" }
  Frontend --> Client: Erreur solde insuffisant
else Solde suffisant
  Controller -> DB: SELECT id, merchant_id\nFROM merchant_wallets\nWHERE merchant_id = ?
  DB --> Controller: merchantWallet
  
  Controller -> DB: UPDATE wallet_accounts\nSET balance = balance - amount\nWHERE id = clientWallet
  Controller -> DB: UPDATE merchant_wallets\nSET balance = balance + amount\nWHERE id = merchantWallet
  
  Controller -> DB: INSERT INTO transactions\n(id, sender, receiver, amount, 'MAD', 'QR_PAYMENT', 'COMPLETED', note)
  
  Controller -> Ledger: recordTransaction()
  Ledger -> DB: INSERT INTO ledger_entries (2 entrées)
  
  Controller -> DB: COMMIT
  
  Controller -> DB: INSERT INTO notifications\n(clientId, 'PAYMENT', 'QR Payment Successful')
  Controller -> DB: INSERT INTO notifications\n(merchantOwnerId, 'PAYMENT', 'QR Payment Received')
  Controller -> DB: INSERT INTO audit_logs
  
  Controller --> Frontend: { message: "QR Payment successful", transactionId }
  Frontend --> Client: Confirmation avec animation
  Frontend --> Merchant: Notification SSE (nouvelle vente)
end

@enduml
```

### Types de QR supportés

| Type | Données encodées | Destination | Wallet |
|------|-------------------|-------------|--------|
| Marchand | `merchantId` (UUID) | Compte marchand | `merchant_wallets` |
| Utilisateur | `receiverId` (UUID) | Utilisateur direct | `wallet_accounts` |

---

## 6. Diagramme de séquence — Paiement Crypto

### Description

Ce diagramme présente la gestion des crypto-monnaies (BTC, ETH, USDT) dans la plateforme. Bien que les wallets crypto existent, les transferts sont internes à la plateforme (hors chaîne) en attendant la régulation.

### Code PlantUML

```plantuml
@startuml
actor "Utilisateur" as User
participant "Frontend" as Frontend
participant "API" as API
participant "walletController" as Controller
participant "exchangeService" as Exchange
database "MySQL" as DB

== Consultation des portefeuilles crypto ==

User -> Frontend: Ouvre le Dashboard
Frontend -> API: GET /auth/me (via apiFetch)
API -> DB: SELECT * FROM wallet_accounts\nWHERE user_id = ?
DB --> API: [{currency:'BTC', balance:0.5, type:'crypto', status:'pending_regulation'}, ...]
API --> Frontend: wallets[]
Frontend --> User: Affiche les 6 portefeuilles (fiat + crypto)

== Conversion crypto → fiat (interne) ==

User -> Frontend: Sélectionne ConvertModal\nDe: BTC → Vers: MAD
Frontend -> API: GET /exchange/rates/live
API -> Exchange: getLiveRates()
Exchange -> Exchange: Vérification cache (TTL 60s)

alt Cache valide
  Exchange --> API: cached rates
else Cache expiré
  Exchange -> Exchange: fetch CoinGecko API
  Exchange -> Exchange: Mise à jour cache
  Exchange --> API: fresh rates
end

API --> Frontend: { BTC: { MAD: 850000 }, ... }
Frontend --> User: Affiche le taux : 1 BTC = 850 000 MAD

User -> Frontend: Confirme la conversion (0.1 BTC → 85 000 MAD)
Frontend -> API: POST /wallet/convert\n{fromCurrency:'BTC', toCurrency:'MAD', amount:0.1}

API -> Controller: convert()
Controller -> DB: START TRANSACTION
Controller -> DB: SELECT balance FROM wallet_accounts\nWHERE user_id = ? AND currency = 'BTC' FOR UPDATE

alt Solde BTC insuffisant
  Controller -> DB: ROLLBACK
  Controller --> Frontend: 400 { error: "Insufficient BTC balance" }
else Solde suffisant
  Controller -> Controller: Calcul : 0.1 * 850000 = 85000 MAD
  Controller -> Controller: Frais conversion MAD : 85000 * 0.015 = 1275 MAD
  Controller -> Controller: Montant net : 85000 - 1275 = 83625 MAD
  
  Controller -> DB: UPDATE wallet_accounts\nSET balance = balance - 0.1\nWHERE currency = 'BTC'
  Controller -> DB: UPDATE wallet_accounts\nSET balance = balance + 83625\nWHERE currency = 'MAD'
  
  Controller -> DB: INSERT INTO transactions\n(type='CONVERSION', amount=0.1, currency='BTC')
  Controller -> DB: INSERT INTO currency_conversions\n(from='BTC', to='MAD', ...)
  
  Controller -> DB: COMMIT
  Controller --> Frontend: { message: "Conversion successful", netAmount: 83625 }
  Frontend --> User: Soldes mis à jour
end

@enduml
```

### Statut des wallets crypto

| Devise | Type | Statut | Fonctionnalités |
|--------|------|--------|-----------------|
| BTC | crypto | `pending_regulation` | Consultation, conversion interne |
| ETH | crypto | `pending_regulation` | Consultation, conversion interne |
| USDT | crypto | `pending_regulation` | Consultation, conversion interne |

---

## 7. Diagramme d'activités

### Description

Ce diagramme modélise le flux complet d'une transaction depuis l'initiation jusqu'à la finalisation, en incluant les différents chemins possibles (succès, échec, annulation).

### Code PlantUML

```plantuml
@startuml
start
:Utilisateur choisit un type de transaction;

if (Type de transaction) then (Transfert P2P)
  :Saisir destinataire;
  :Saisir montant et devise;
  :Rechercher utilisateur;
  
  if (Utilisateur trouvé?) then (Oui)
    :Calculer les frais;
  else (Non)
    :Afficher erreur "Utilisateur introuvable";
    stop
  endif
  
elseif (Paiement QR) then
  :Ouvrir le scanner caméra;
  :Attendre scan du QR code;
  
  if (QR code valide?) then (Oui)
    :Décoder merchantId ou receiverId;
    :Afficher les détails du paiement;
    :Saisir le montant;
  else (Non)
    :Afficher erreur "QR code invalide";
    stop
  endif

elseif (Dépôt) then
  :Choisir méthode de dépôt;
  
  if (Méthode) then (Carte bancaire)
    :Frais = 1.5%;
  elseif (Virement bancaire) then
    :Frais = 1%;
  else (Store/Crypto)
    :Frais = 0%;
  endif
  
  :Saisir montant;

elseif (Retrait) then
  :Choisir devise de retrait;
  
  if (Devise) then (MAD)
    :Frais = 2%;
  elseif (EUR/USD) then
    :Frais = 2.5%;
  else (Crypto)
    :Frais = 0%;
  endif
  
  :Saisir montant;
endif

:Vérifier le solde du portefeuille source;

if (Solde suffisant?) then (Oui)
  :Démarrer transaction SQL;
  :Débiter le compte source (montant + frais);
  :Créer notification pour l'expéditeur;
  
  if (Type avec destinataire?) then (Oui)
    :Créditer le compte destinataire;
    :Créer notification pour le destinataire;
  endif
  
  :Enregistrer écritures comptables (ledger);
  :Attribuer points de fidélité;
  
  if (Transaction réussie?) then (Oui)
    :Valider (COMMIT);
    :Journaliser dans audit_logs;
    :Afficher confirmation;
  else (Non)
    :Annuler (ROLLBACK);
    :Afficher message d'erreur;
    stop
  endif
else (Non)
  :Afficher erreur "Solde insuffisant";
  stop
endif

stop
@enduml
```

### Description des branches

| Branche | Condition | Actions |
|---------|-----------|---------|
| Transfert P2P | Destinataire trouvé | Calcul frais (0% ou 2,5%), validation solde, exécution |
| Paiement QR | QR valide | Scan → décodage → confirmation montant → exécution |
| Dépôt | Méthode choisie | Frais variables (0-1,5%), mise à jour solde |
| Retrait | Devise choisie | Frais variables (0-2,5%), mise à jour solde |
| Échec | Solde insuffisant | Rollback transactionnel, message d'erreur |

---

## 8. Diagramme de composants

### Description

Ce diagramme présente l'architecture physique des composants logiciels et leurs dépendances. Il montre comment les différents modules interagissent entre eux et avec les systèmes externes.

### Code PlantUML

```plantuml
@startuml
!theme plain

package "Frontend (Next.js 14)" as Frontend {
  [Pages Next.js] as Pages
  [Composants UI] as Components
  [Client API (lib/api.ts)] as APIClient
  [Providers (Toast, Theme)] as Providers
  
  Pages --> Components
  Pages --> APIClient
  Components --> APIClient
  Providers --> Pages
}

package "Backend (Express)" as Backend {
  [Routeur API (api.js)] as Router
  
  package "Middlewares" as Middlewares {
    [auth.js] as AuthMW
    [admin.js] as AdminMW
    [merchant.js] as MerchantMW
    [rateLimit.js] as RateLimit
    [idempotency.js] as Idempotency
  }
  
  package "Contrôleurs" as Controllers {
    [authController]
    [walletController]
    [transactionController]
    [transferController]
    [cardController]
    [merchantController]
    [adminController]
    [kycController]
    [disputeController]
    [notificationController]
    [loyaltyController]
    [profileController]
    [limitController]
    [exchangeController]
    [dashboardController]
  }
  
  package "Services" as Services {
    [transferService]
    [walletService]
    [ledgerService]
    [exchangeService]
    [merchantService]
    [emailService]
    [riskService]
  }
  
  package "Lib" as Lib {
    [db.js (MySQL Pool)]
    [config.js]
    [logger.js (Winston)]
    [validation.js (Joi)]
    [auditLogger.js]
  }
  
  Router --> Middlewares
  Router --> Controllers
  Controllers --> Services
  Services --> Lib
  Controllers --> Lib
}

database "MySQL 8" as DB {
  [users]
  [wallet_accounts]
  [transactions]
  [cards]
  [merchants]
  [ledger_entries]
  [notifications]
  [kyc_verifications]
  [disputes]
  [audit_logs]
  [exchange_rates]
  [refresh_tokens]
}

node "APIs Externes" as External {
  [Frankfurter.app]
  [ExchangeRate-API]
  [CoinGecko]
}

Frontend --> Backend : HTTPS REST + SSE
Backend --> DB : mysql2/promise
Backend --> External : HTTP fetch

@enduml
```

### Dépendances entre composants

| Composant | Dépend de | Type de dépendance |
|-----------|-----------|-------------------|
| Pages Next.js | Composants UI, Client API | Import direct |
| Client API | Backend (API Express) | HTTP REST |
| Routeur API | Middlewares, Contrôleurs | Import require |
| Contrôleurs | Services, Lib (db, auditLogger) | Import require |
| Services | Lib (db) | Import require |
| Services | APIs externes | HTTP fetch |
| Backend | MySQL 8 | mysql2/promise |

---

## 9. Diagramme de déploiement

### Description

Ce diagramme décrit l'architecture physique de déploiement de l'application, que ce soit en environnement de développement ou en production avec Docker.

### Code PlantUML

```plantuml
@startuml
!theme plain

actor "Utilisateur" as User
actor "Administrateur" as Admin
actor "Marchand" as Merchant

node "Navigateur Web" as Browser {
  [Application React (Next.js)]
}

node "Serveur de Développement" as DevServer {
  [Node.js Dev Server\n(Next.js)\nPort 3000] as NextDev
  [Node.js API Server\n(Express)\nPort 5000] as ExpressDev
}

node "Environnement Docker" as Docker {
  [Conteneur Frontend\nNode.js 18\nPort 3000\nnpm run start] as FrontendCont
    
  [Conteneur Backend\nNode.js 18\nPort 5000\nnode src/app.js] as BackendCont
    
  [Conteneur MySQL\nMySQL 8.0\nPort 3306] as MySQLCont
}

node "APIs Externes" as External {
  [Frankfurter.app\n(Taux de change)]
  [ExchangeRate-API\n(Taux de change)]
  [CoinGecko\n(Prix crypto)]
}

User --> Browser : HTTPS
Admin --> Browser : HTTPS
Merchant --> Browser : HTTPS

Browser --> DevServer : http://localhost:3000
Browser --> Docker : https://marjane-wallet.com

DevServer --> ExpressDev : API Proxy /api/*
ExpressDev --> MySQLCont : mysql://root@localhost:3306/marjane_wallet

Docker {
  FrontendCont --> BackendCont : API /api/*
  BackendCont --> MySQLCont : mysql://root@mysql:3306/marjane_wallet
}

BackendCont --> External : HTTP (fetch)
ExpressDev --> External : HTTP (fetch)

note right of Docker
  docker-compose.yml
  - mysql (healthcheck)
  - backend (dépend de mysql)
  - frontend (dépend de backend)
end note

note right of ExpressDev
  Fichiers .env :
  - .env.development
  - .env.production
  - .env.staging
end note

@enduml
```

### Configuration Docker

```yaml
services:
  mysql:
    image: mysql:8.0
    ports: ["3306:3306"]
    volumes: [mysql_data:/var/lib/mysql]

  backend:
    build: ./backend
    ports: ["5000:5000"]
    environment:
      DATABASE_URL: mysql://root@mysql:3306/marjane_wallet
    depends_on: [mysql: condition: service_healthy]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000/api
    depends_on: [backend]
```

### Fichiers d'environnement

| Fichier | Utilisation | NODE_ENV |
|---------|-------------|----------|
| `.env.development` | Développement local | development |
| `.env.staging` | Pré-production | staging |
| `.env.production` | Production | production |

---

## 10. Diagramme de packages

### Description

Ce diagramme présente l'organisation en packages du code source, en suivant la structure réelle des dossiers du projet. Il montre les dépendances entre les packages et le sens des imports.

### Code PlantUML

```plantuml
@startuml
!theme plain

package "frontend" as FE {
  package "pages (app/)" as Pages {
    [dashboard/]
    [admin/]
    [merchant/]
    [login/]
    [register/]
    [profile/]
    [cards/]
    [kyc/]
    [transactions/]
  }
  
  package "components" as Components {
    [Wallet/\n(13 composants)]
    [ui/\n(10 composants)]
  }
  
  package "lib" as LibFE {
    [api.ts]
  }
}

package "backend" as BE {
  package "routes" as Routes {
    [api.js]
  }
  
  package "controllers" as Ctrl {
    [authController]
    [walletController]
    [transactionController]
    [transferController]
    [cardController]
    [merchantController]
    [adminController]
    [kycController]
    [disputeController]
    [notificationController]
    [loyaltyController]
    [profileController]
    [limitController]
    [exchangeController]
    [dashboardController]
  }
  
  package "services" as Srv {
    [transferService]
    [walletService]
    [ledgerService]
    [exchangeService]
    [merchantService]
    [emailService]
    [riskService]
  }
  
  package "middleware" as MW {
    [auth.js]
    [admin.js]
    [merchant.js]
    [rateLimit.js]
    [idempotency.js]
  }
  
  package "lib" as LibBE {
    [db.js]
    [config.js]
    [logger.js]
    [validation.js]
    [auditLogger.js]
    [validate.js]
  }
  
  package "database" as DB {
    [migrations/\n(13 fichiers)]
    [seeds/]
    [seed.js]
  }
}

Pages --> Components : utilise
Pages --> LibFE : utilise
Components --> LibFE : utilise

Routes --> MW : applique
Routes --> Ctrl : délègue

Ctrl --> Srv : appelle
Ctrl --> LibBE : utilise

Srv --> LibBE : utilise

MW --> LibBE : utilise

LibBE --> [mysql2/promise] : requêtes
LibBE --> [jsonwebtoken] : JWT
LibBE --> [bcryptjs] : hash
LibBE --> [joi] : validation
LibBE --> [winston] : logs

@enduml
```

### Description des packages

| Package | Contenu | Dépendances |
|---------|---------|-------------|
| `frontend/src/app` | Pages Next.js (App Router) | Components, lib/api.ts |
| `frontend/src/components` | Composants React | lib/api.ts |
| `frontend/src/lib` | Client API | Backend (HTTP) |
| `backend/src/routes` | Définition des routes | Controllers, Middleware |
| `backend/src/controllers` | Logique métier | Services, Lib |
| `backend/src/services` | Services métier | Lib (db) |
| `backend/src/middleware` | Filtres HTTP | Lib (db, jwt) |
| `backend/src/lib` | Utilitaires | Packages npm |
| `backend/database` | Migrations + Seed | Knex |

---

## 11. Diagramme de communication

### Description

Ce diagramme montre les interactions entre les objets lors du flux d'authentification, en mettant l'accent sur la séquence temporelle des échanges.

### Code PlantUML

```plantuml
@startuml
actor Utilisateur as U
participant Frontend as FE
participant "authController" as AC
participant "emailService" as ES
participant "auditLogger" as AL
participant "riskService" as RS
database DB as DB

U -> FE: 1: Saisit email + password
FE -> AC: 2: POST /auth/login
AC -> DB: 3: SELECT * FROM users WHERE email = ?
DB --> AC: 4: user data hashé
AC -> AC: 5: bcrypt.compare(password, hash)
AC -> DB: 6: UPDATE users SET mfa_code = ?
AC -> ES: 7: sendMFACode(email, mfaCode)
AC --> FE: 8: { requireMFA: true, userId }
FE --> U: 9: Affiche formulaire MFA

U -> FE: 10: Saisit code MFA
FE -> AC: 11: POST /auth/verify-mfa
AC -> DB: 12: SELECT * FROM users WHERE id = ?
DB --> AC: 13: user + mfa_code + mfa_expires
AC -> DB: 14: SELECT NOW() > mfa_expires AS isExpired
DB --> AC: 15: isExpired
AC -> AC: 16: Compare code
AC -> DB: 17: UPDATE users SET mfa_code = NULL
AC -> RS: 18: logRiskEvent(NEW_DEVICE_LOGIN)
AC -> AC: 19: jwt.sign() + uuid()
AC -> DB: 20: INSERT INTO refresh_tokens
AC -> AL: 21: logAudit(LOGIN_SUCCESS)
AC --> FE: 22: { accessToken, refreshToken, role }
FE -> FE: 23: localStorage.setItem("token")
FE -> FE: 24: localStorage.setItem("refreshToken")
FE --> U: 25: Redirection Dashboard

@enduml
```

### Séquence des échanges

| # | Émetteur | Destinataire | Message |
|---|----------|-------------|---------|
| 1 | Utilisateur | Frontend | Email + mot de passe |
| 2 | Frontend | authController | POST /auth/login |
| 3 | authController | DB | SELECT utilisateur |
| 4 | DB | authController | Données utilisateur |
| 5 | authController | authController | Vérification bcrypt |
| 6 | authController | DB | UPDATE code MFA |
| 7 | authController | emailService | Envoi email MFA |
| 8 | authController | Frontend | requireMFA: true |
| 9 | Frontend | Utilisateur | Formulaire MFA |
| 10 | Utilisateur | Frontend | Code MFA |
| 11 | Frontend | authController | POST /auth/verify-mfa |
| 12-15 | authController | DB | Vérification code MFA |
| 16-17 | authController | DB | Validation + effacement |
| 18 | authController | riskService | Log nouvel appareil |
| 19-21 | authController | DB | Génération tokens + audit |
| 22-25 | authController | Utilisateur | Tokens + redirection |

---

## 12. Diagramme d'états

### Description

Ce diagramme modélise les différents états d'une transaction et les transitions possibles entre ces états, depuis sa création jusqu'à son achèvement ou son annulation.

### Code PlantUML

```plantuml
@startuml
!theme plain

state "Transaction" as TR {
  [*] --> PENDING : Création
  
  PENDING --> COMPLETED : Validation réussie\n(débit/crédit OK)
  PENDING --> FAILED : Erreur de validation\n(solde insuffisant, etc.)
  PENDING --> REVERSED : Annulation admin
  
  COMPLETED --> REVERSED : Annulation admin\nvia /admin/transactions/reverse
  
  FAILED --> PENDING : Nouvelle tentative
  
  REVERSED --> [*]
  FAILED --> [*]
}

state "PENDING" as Pending {
  state "Vérification" as Verif
  state "Attente" as Wait
  
  [*] --> Verif : Idempotency key OK
  Verif --> Wait : Solde vérifié
  Verif --> FAILED : Solde insuffisant
}

state "COMPLETED" as Completed {
  state "Ledger" as Ledger
  state "Loyalty" as Loyalty
  state "Notification" as Notif
  
  [*] --> Ledger : Écritures comptables
  Ledger --> Loyalty : Points de fidélité
  Loyalty --> Notif : Notifications push
  Notif --> [*] : Terminé
}

state "KYC Verification" as KYC {
  [*] --> UNVERIFIED : Inscription
  UNVERIFIED --> PENDING_KYC : Soumission documents
  PENDING_KYC --> VERIFIED : Approbation admin
  PENDING_KYC --> REJECTED : Rejet admin
  VERIFIED --> [*]
  REJECTED --> PENDING_KYC : Nouvelle soumission
}

@enduml
```

### États d'une transaction

| État | Description | Transitions possibles |
|------|-------------|----------------------|
| **PENDING** | En attente de validation | → COMPLETED, → FAILED, → REVERSED |
| **COMPLETED** | Transaction réussie | → REVERSED |
| **FAILED** | Échec (solde, erreur technique) | → PENDING (pas dans l'app actuelle) |
| **REVERSED** | Annulée par l'administrateur | Terminus |

### États KYC

| État | Description | Transitions possibles |
|------|-------------|----------------------|
| **UNVERIFIED** | Aucun document soumis | → PENDING_KYC |
| **PENDING_KYC** | Documents soumis, en attente de revue | → VERIFIED, → REJECTED |
| **VERIFIED** | KYC approuvé | Terminus |
| **REJECTED** | KYC rejeté | → PENDING_KYC |

### États d'un litige

| État | Description | Transitions possibles |
|------|-------------|----------------------|
| **OPEN** | Litige ouvert, en cours d'investigation | → RESOLVED |
| **RESOLVED** | Résolu par l'administrateur | Terminus |

---

*Document généré le 26 juin 2026 — Projet Marjane Wallet PFE*
