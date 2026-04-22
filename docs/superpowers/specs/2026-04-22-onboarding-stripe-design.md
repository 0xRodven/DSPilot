# Onboarding + Stripe — Design Doc

**Date** : 2026-04-22
**Auteur** : Ousmane + Claude Code (superpowers:brainstorming)
**Statut** : Approuvé — en attente relecture finale
**Objectif** : permettre la vente de DSPilot dès demain (2026-04-23) à des prospects DSP via un flow book-a-call → payment → onboarding concierge.

---

## 1. Contexte et contraintes

### Pourquoi maintenant

Ousmane a 2 warm leads prêts à signer (son pote DSP manager + le patron de ce dernier). Aujourd'hui, aucun flow onboarding ni Stripe n'existe : le seul tenant (DIF1) a été créé à la main. Pour pouvoir clore une vente, il faut :
- Un moyen pour un prospect de booker une démo
- Un moyen pour Ousmane de facturer après le call
- Un moyen de provisionner le prospect (Clerk org + Convex station) après paiement
- Une démo crédible à montrer en call (sans exposer les vraies data DIF1)

### Ce qui n'est PAS dans le scope

- Self-serve signup depuis `/pricing` (reporté — nécessite webhook auto complet)
- Feature gating Pro vs Business dans le code (YAGNI — tous payeurs ont même accès aujourd'hui)
- Customer Portal Stripe (Ousmane gère via dashboard Stripe manuellement pour les 10 premiers clients)
- Trial période (décision : pas de trial, paiement direct après call)
- Refonte landing "agent-first" (la landing actuelle suffit)
- Slides McKinsey-grade (demain)
- Stratégie Apollo (après les 2 premiers closes)

### Contraintes techniques

- Stack existante : Next.js 16 App Router, Convex (prod = `sincere-rhinoceros-718`), Clerk (orgs activés), Tailwind + shadcn/ui
- Hébergement : Vercel (front + API routes), Hetzner VPS (scrapers Amazon + Telegram Brain)
- Schema Convex : `stations` existe avec `organizationId` optionnel ; pas de table `subscriptions` ; pas de fields Stripe
- Pricing figé : Pro 499€/mois (399 annuel), Business 999€/mois (799 annuel), Enterprise sur devis

---

## 2. Décisions prises

| # | Question | Choix | Raison |
|---|----------|-------|--------|
| 1 | Comment connecter Amazon pour un nouveau client ? | **A. Concierge manuel** | Ousmane SSH le VPS et pose les cookies. Scalable jusqu'à 20 clients, pas de dev à faire. |
| 2 | Quand le client paye ? | **P3. Book-a-call puis Payment Link** | Warm leads connus. Conversion max via call. Self-serve Checkout pour plus tard. |
| 3 | Modèle pricing vs stations ? | **M2. 1 tier = stations illimitées** | 99% des DSP FR ont 1 station. Zéro logique addon Stripe. |
| 4 | Compte démo pour la pitch call ? | **D2 + D3** | Tenant dédié data clonée anonymisée + page `/demo` publique read-only refreshée. |
| 5 | Scope shippable aujourd'hui ? | **4 must-ship** | Stripe + Cal.com embed + demo tenant + CTA pricing changées. Landing/slides/Apollo = demain. |
| 6 | Implémentation onboarding post-payment ? | **C. CLI** | `bun scripts/onboard-customer.ts`. Webhook stub seulement pour audit. 1.5-2h vs 5h pour webhook full-auto. |

---

## 3. Architecture — end-to-end flow

```
[1] Prospect → dspilot.fr
    CTA "Réserver une démo" (hero + pricing cards)
    └─ Cal.com modal embed → booking créé
       └─ Ousmane reçoit notif + email Cal.com

[2] Call 30 min → closing → plan choisi (Pro ou Business)
    └─ Ousmane envoie Stripe Payment Link correspondant par mail

[3] Prospect clique → Stripe Checkout → paye
    └─ success_url = /paid?session_id=...
    └─ Webhook stub /api/webhooks/stripe
       └─ Insert dans stripeEvents (audit trail)

[4] Ousmane reçoit email Stripe "payment received"
    └─ Lance : bun scripts/onboard-customer.ts \
                 --email=X --plan=Y --station-code=Z --station-name="..."
    Le script :
    ├─ Clerk Backend : createOrganization + invite user (Owner role)
    ├─ Convex : insert station (plan, organizationId, stripe IDs, initialSetupStatus=pending)
    └─ Convex : insert subscription audit row

[5] Client reçoit invitation Clerk → set password → /dashboard
    └─ Bandeau : "Import initial en cours — sous 24h"

[6] Ousmane (concierge) : SSH VPS
    ├─ Pose cookies Amazon du client
    ├─ Trigger premier scrape manuel pour sa station
    └─ Email "c'est prêt" → client rafraîchit → data visible
```

### Edge cases

| Cas | Comportement |
|-----|-------------|
| Payment double-click | Stripe idempotency : 1 session = 1 subscription |
| Email déjà user Clerk | Script détecte et crée juste nouvel org, ajoute user comme Owner de l'org |
| Station code déjà pris | Script échoue proprement sauf `--force` |
| Webhook perdu / rate-limited | Non-critique : CLI est la source de vérité, webhook = audit only |
| Client paye mais close avant le provisionnement | `stripeEvents.processed=false` → Ousmane voit dans logs |

---

## 4. Changements de code

### 4.1 Schéma Convex (`convex/schema.ts`)

```ts
stations: defineTable({
  // ... champs existants
  plan: v.union(
    v.literal("free"),
    v.literal("pro"),
    v.literal("business"),      // ajout
    v.literal("enterprise"),
  ),
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  subscriptionStatus: v.optional(
    v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("trialing"),
    ),
  ),
  initialSetupStatus: v.optional(
    v.union(v.literal("pending"), v.literal("in_progress"), v.literal("ready")),
  ),
})

stripeEvents: defineTable({
  stripeEventId: v.string(),
  type: v.string(),
  payload: v.any(),
  processed: v.boolean(),
  receivedAt: v.number(),
})
  .index("by_stripe_event_id", ["stripeEventId"]),
```

### 4.2 Nouveaux fichiers

| Fichier | Rôle |
|---|---|
| `scripts/onboard-customer.ts` | CLI — crée Clerk org + invite + station + subscription row |
| `scripts/create-demo-tenant.ts` | CLI — seed org "DSPilot Demo" |
| `scripts/anonymize-demo-data.ts` | Utility — clone DIF1 S14-S17 avec drivers renommés |
| `src/app/api/webhooks/stripe/route.ts` | Webhook stub : vérifie signature, insert `stripeEvents`, 200 OK |
| `src/app/paid/page.tsx` | Page "Merci" post-Checkout |
| `src/components/landing/cal-embed.tsx` | Wrapper `@calcom/embed-react` popup |
| `convex/stripeEvents.ts` | Mutation idempotente `recordEvent` |
| `convex/subscriptions.ts` | Mutations internes `recordSubscription`, `markProcessed` |
| `convex/demo.ts` (extension) | Query publique `getDashboardPublic` pour `/demo` |

### 4.3 Fichiers modifiés

| Fichier | Change |
|---|---|
| `src/components/linkify/pricing.tsx` | 3 CTAs `/sign-up?plan=*` → `<CalEmbed trigger=... />` |
| `src/components/linkify/hero.tsx` | CTA principal → "Réserver une démo" (Cal.com) |
| `src/app/(marketing)/page.tsx` | Inject Cal.com script une fois |
| `src/app/demo/page.tsx` | Point queries vers demo-tenant org read-only |
| `src/middleware.ts` | Add `/paid` + `/api/webhooks/stripe` aux routes publiques |
| `convex/stations.ts` | `createStation` accepte champs Stripe |
| `package.json` | Add `stripe`, `@clerk/backend`, `@calcom/embed-react` |

### 4.4 Setup externe (hors code)

**Stripe Dashboard** (Ousmane, 30-45 min) :
- Activer Stripe Tax (VAT FR 20%)
- 2 Products : "DSPilot Pro", "DSPilot Business"
- 4 Prices : monthly/yearly par product
- 4 Payment Links avec `success_url=https://dspilot.fr/paid?session_id={CHECKOUT_SESSION_ID}`
- Copier les 4 URLs dans `.env.local` et Vercel env : `STRIPE_PAYMENT_LINK_PRO_MONTHLY`, etc.
- Webhook endpoint : `https://dspilot.fr/api/webhooks/stripe` — events : `checkout.session.completed`, `invoice.paid`, `customer.subscription.*`
- Copier `STRIPE_WEBHOOK_SECRET` dans envs

**Cal.com** (Ousmane, 15 min) :
- Compte `dspilot.cal.com/ousmane` (fallback `cal.com/ousmane-dspilot`)
- Event type "Démo DSPilot — 30min" (visio Google Meet auto)
- Webhook → email Ousmane
- Copier le slug dans `.env` : `NEXT_PUBLIC_CAL_LINK`

---

## 5. Demo tenant (D2)

### Création

```
scripts/create-demo-tenant.ts
├─ Clerk Backend API → createOrganization("DSPilot Demo")
├─ Invite demo@dspilot.fr (alias Ousmane) comme Owner
├─ Convex mutation demo.seedDemoStation
│  ├─ station "DEMO" plan="business" organizationId=<demo-org-id>
│  └─ initialSetupStatus="ready" (pas de bandeau)
└─ Call anonymize-demo-data.ts → clone S14-S17
```

### Anonymisation

`scripts/anonymize-demo-data.ts` :
- Lit DIF1 : `drivers`, `driverWeeklyStats`, `driverDailyStats`, `dnrInvestigations`, `stationDeliveryStats`, `driverAssociateStats`
- Pour chaque driver : nom réel → `Livreur ${adjectif FR aléatoire} ${index padded}` (e.g. "Livreur Curieux 01", "Livreuse Attentive 02")
- Amazon IDs regénérés (hash stable basé sur nom original pour cohérence cross-table)
- Écrit dans station DEMO ; préserve distribution réaliste (tiers, DNR par reason, %DWC)

### `/demo` public (D3)

`src/app/demo/page.tsx` :
- Query Convex `demo.getDashboardPublic` (no auth, read-only, hardcodé sur demo-org-id)
- Vue réduite : DWC station actuel + top 5 drivers + trend 4 semaines
- Watermark : "Données démo — vos données resteront privées"
- CTA bottom : "Réserver une démo perso" → Cal.com modal

---

## 6. Tests

### Unit / TDD

- `scripts/onboard-customer.ts` : idempotent (2 runs même email → 1 org, pas de doublon)
- `scripts/onboard-customer.ts` : station code collision → erreur claire
- `scripts/onboard-customer.ts` : email déjà user Clerk → ajout à nouvel org, pas de création user
- `convex/stripeEvents.ts` : `recordEvent` idempotent sur `stripeEventId`
- Webhook : signature invalide → 401 ; signature valide → 200 + event enregistré

### Smoke E2E (avant call demain)

1. Landing → clic CTA pricing → Cal.com modal → booking test passe
2. Paiement Stripe test card 4242 → `/paid` page → event dans `stripeEvents`
3. Onboard CLI avec `test@example.com` → invitation Clerk reçue → set password → dashboard avec bandeau pending
4. Switch org vers "DSPilot Demo" → dashboard plein avec data anonymisée
5. Navigation `/demo` sans auth → vue publique s'affiche

Tool : `browse` MCP pour automatiser les clics.

---

## 7. Timebox

| Bloc | Heures | Dépend de | Track |
|---|---|---|---|
| A. Schema migration + types | 0.5 | — | backend |
| B. Setup Stripe + Cal.com dashboards (manuel Ousmane) | 1.0 | — | ops |
| C. CLI `onboard-customer.ts` + tests | 2.0 | A | backend |
| D. Webhook stub + `stripeEvents` | 0.5 | A | backend |
| E. Landing CTAs → Cal embed + `/paid` page | 1.0 | B | frontend |
| F. Demo tenant seed + anonymize scripts + run | 2.0 | A, C | demo |
| G. `/demo` public refresh | 0.5 | F | frontend |
| H. E2E smoke test complet | 0.5 | tous | QA |
| **Total** | **8h** | | |

**Parallélisation** : 3 subagents sur les tracks backend / frontend / demo avec merge final.

---

## 8. Risques / unknowns

| # | Risque | Mitigation |
|---|--------|-----------|
| R1 | `CLERK_SECRET_KEY` pas encore sur Vercel prod | Vérifier via `vercel env ls` en début de journée, ajouter si absent |
| R2 | Clerk Backend SDK jamais utilisé côté code | Read docs officielles en premier, scaffold minimal avant logique métier |
| R3 | Stripe Tax nécessite adresse société + SIRET | Ousmane a déjà les infos (cf `/legal` page), 10 min setup |
| R4 | Domaine `dspilot.cal.com` déjà pris | Fallback `cal.com/ousmane-dspilot`, rename URLs après |
| R5 | Anonymisation demo data rate les cross-references | Hasher Amazon IDs originaux pour garder cohérence drivers ↔ stats |
| R6 | Webhook rate-limité par Stripe si spike | Non-critique aujourd'hui (events = 2-3/jour), monitored plus tard |
| R7 | Convex dev vs prod : script demo pousse-t-il en prod ? | Hardcode prod Convex URL dans scripts (pas d'accident sur dev) |

---

## 9. Post-ship (pas pour aujourd'hui)

Une fois les 4 must-ship livrés et la première vente close, roadmap suivante :

- **Landing refonte "agent-first"** (sections Telegram Brain, auto-coaching, KPI temps réel)
- **Slides McKinsey-grade** avec bouton "voir démo" deep-link vers demo tenant
- **Self-serve Checkout** sur `/pricing` + webhook full-auto (Approche W remplace C)
- **Customer Portal Stripe** pour que le client gère carte/facturation
- **Apollo distribution** (cibler DSP owners FR via MCP Apollo déjà activé)
- **Feature gating** réel Pro vs Business si les 2 premiers clients le demandent

---

## 10. Validation

Cette spec a été discutée section par section via brainstorming. Décisions 1-6 actées.
Relecture finale requise avant passage à writing-plans.
