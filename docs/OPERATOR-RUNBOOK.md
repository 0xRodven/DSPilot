# DSPilot — Runbook opérateur

> Pour Ousmane. Tout ce qu'il faut savoir pour closer et provisionner un client, de la prise de RDV jusqu'au dashboard actif.
> Dernière MAJ : 2026-04-22

---

## 1. One-time — setup Stripe + Cal.com (avant les premières ventes)

### Stripe (~30 min)

1. Créer un compte sur https://dashboard.stripe.com avec `ousmane@dspilot.fr`
2. Remplir le profil société (SIRET, n° TVA) — récupérer infos depuis `src/app/(marketing)/legal/page.tsx`
3. Activer **Stripe Tax** → Settings → Tax → Activer pour FR (TVA 20% auto)
4. **Créer 2 Products** :
   - `DSPilot Pro` — description : "Le tableau de bord complet pour piloter votre station"
   - `DSPilot Business` — description : "Coaching, rapports, WhatsApp, API"
5. **Créer 4 Prices** (un par Product × mensuel/annuel) :
   - Pro mensuel : 499 EUR, recurring monthly
   - Pro annuel : 4 788 EUR (399×12), recurring yearly — indiquer "399 EUR/mois facturé 4 788 EUR/an"
   - Business mensuel : 999 EUR, recurring monthly
   - Business annuel : 9 588 EUR (799×12), recurring yearly
6. **Créer 4 Payment Links** (un par Price), pour chaque :
   - Success URL : `https://dspilot.fr/paid?session_id={CHECKOUT_SESSION_ID}`
   - Collect billing address + VAT ID
   - Limit to 1 per customer
7. Copier les 4 URLs dans `.env.local` et Vercel :
   ```
   STRIPE_PAYMENT_LINK_PRO_MONTHLY=...
   STRIPE_PAYMENT_LINK_PRO_YEARLY=...
   STRIPE_PAYMENT_LINK_BUSINESS_MONTHLY=...
   STRIPE_PAYMENT_LINK_BUSINESS_YEARLY=...
   ```
8. **Webhook endpoint** : Developers → Webhooks → Add endpoint → `https://dspilot.fr/api/webhooks/stripe` → events :
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
9. Copier le **Signing secret** → `STRIPE_WEBHOOK_SECRET` dans envs
10. Récupérer **Secret key** (test + live) → `STRIPE_SECRET_KEY` dans envs (live pour prod, test pour dev)
11. Pousser envs sur Vercel :
    ```bash
    vercel env add STRIPE_SECRET_KEY production
    vercel env add STRIPE_WEBHOOK_SECRET production
    vercel env add STRIPE_PAYMENT_LINK_PRO_MONTHLY production
    # ... idem pour les 3 autres
    ```

### Cal.com (~10 min)

1. S'inscrire sur https://cal.com avec `ousmane@dspilot.fr`
2. Choisir le handle (ex: `ousmane-dspilot`) → URL = `cal.com/ousmane-dspilot`
3. Créer event type "Démo DSPilot — 30min" :
   - Durée : 30 min
   - Location : Google Meet (connecter son compte Google)
   - Timezone : Europe/Paris
   - Questions : "Nom de votre station Amazon DSP ?", "Taille équipe livreurs ?"
4. Workflows → Add → on booking created → Email to `ousmane@dspilot.fr`
5. Copier le slug complet (ex: `ousmane-dspilot/demo-dspilot-30min`) dans :
   ```
   NEXT_PUBLIC_CAL_LINK=ousmane-dspilot/demo-dspilot-30min
   ```
   Local + Vercel :
   ```bash
   vercel env add NEXT_PUBLIC_CAL_LINK production
   ```
6. Re-deploy Vercel : `vercel --prod`

---

## 2. Avant chaque pitch call

**J-1 ou H-1 :**

- [ ] Vérifier que Cal.com a bien notifié (email + sur téléphone)
- [ ] Se connecter à dspilot.fr, **switch org → DSPilot Demo**, vérifier que le dashboard rend correctement avec les ~114 livreurs pseudonymisés (Maxime Martin, Étienne Michel, etc.)
- [ ] Repro-vérifier les chiffres clés dans la démo : DWC station, top drivers, DNR count
- [ ] Avoir ouvert dans un onglet à part `dspilot.fr/demo` (pour l'envoyer au prospect après)
- [ ] Stripe Payment Links copiés dans un note (Pro/Business mensuel/annuel × 4)
- [ ] Agent Telegram DSPilot allumé (VPS openclaw `systemctl status dspilot-telegram-agent`) — on en parle pendant le pitch

**Checklist preuve dashboard ouvre bien :**
1. Se déconnecter → se reconnecter
2. Avatar en haut à gauche → switch org "DSPilot Demo"
3. Dashboard doit afficher :
   - Bandeau DWC station (~83%)
   - Liste des livreurs avec tiers (Fantastic/Great/Fair/Poor)
   - Breakdown Contact Miss / Photo Defect / DNR
4. Si un panneau blink "Import initial en cours" → c'est normal, c'est le bandeau de `initialSetupStatus=pending`. Demo tenant a `ready` donc pas de bandeau.

---

## 3. Pendant le call (script 30 min)

| Temps | Action |
|---|---|
| 0-3 min | Brise-glace, comprendre sa station (taille, DWC actuel, pain points) |
| 3-8 min | Montre l'app (screen-share) : dashboard demo tenant, tier color-coding, tendance, top/bottom drivers |
| 8-15 min | Drill-down : profil d'un livreur, voir son Contact Miss / Photo Defect / DNR detail GPS |
| 15-20 min | **L'agent Telegram** (point distinctif #1) : "tu peux m'envoyer 'DWC semaine 16 Kitenge' et il te répond instantanément" |
| 20-25 min | Pricing + valeur : "DSPilot te fait gagner 3-5h/semaine. ROI 1ère semaine." |
| 25-30 min | CTA : "Je t'envoie le Payment Link, tu choisis Pro ou Business, tu payes, on te setup dans 24h" |

---

## 4. Après le call — closing

**Option A : il dit oui tout de suite**

1. Copier le Payment Link correspondant (Pro mensuel / annuel / Business mensuel / annuel)
2. Envoyer par mail/Telegram avec message type :
   ```
   Super, content de te compter parmi les premiers.
   Voici le lien de paiement : <URL>
   
   Une fois que tu payes :
   1. Tu recevras un mail "Paiement confirmé" de Stripe
   2. Dans les 24h, un mail d'invitation DSPilot pour créer ton compte
   3. Je me charge de connecter ton Amazon Logistics (tu m'envoies juste
      tes cookies sessions — je t'envoie le tuto 2 min)
   
   Dis-moi dès que c'est payé !
   ```

**Option B : il veut réfléchir**

- Envoyer le lien public `dspilot.fr/demo` — il peut montrer à son équipe
- Programmer un follow-up call à J+3 sur Cal.com
- Noter dans ton CRM (Notion/Apollo) : nom, station, raison de friction

---

## 5. Post-paiement — provisionnement client (concierge)

**Trigger** : mail Stripe "Payment received" arrive.

**Étapes** :

1. Dans Stripe dashboard, récupérer :
   - `customer` ID (`cus_xxx`)
   - `subscription` ID (`sub_xxx`)
   - Email du client

2. Lancer l'onboard CLI depuis `/Users/ousmane/Desktop/DSPilot/` :

   ```bash
   set -a && source .env.local && set +a
   NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud \
   DSPILOT_INVITER_USER_ID=user_37Yc8YaEuX9hxXzeZZzGlytEFeC \
   npm run onboard -- \
     --email=CLIENT_EMAIL \
     --plan=pro \
     --station-code=FR-PSUA-XXX1 \
     --station-name="Nom Station" \
     --stripe-customer=cus_xxx \
     --stripe-subscription=sub_xxx
   ```

   Paramètres :
   - `--email` : email du prospect (le même que celui fourni dans Stripe Checkout)
   - `--plan` : `pro` | `business` | `enterprise`
   - `--station-code` : code officiel Amazon (format `FR-XXXX-XXXX`) — lui demander
   - `--station-name` : nom commercial pour l'UI
   - `--stripe-customer` / `--stripe-subscription` : depuis Stripe dashboard

   Output attendu :
   ```
   ▶ Onboarding client@xxx.fr as pro for FR-PSUA-XXX1
     user: new
     ✓ Clerk org created: org_XXX
     ✓ invitation sent to client@xxx.fr
     ✓ Convex station inserted: m5XXXXXXX
   
   ✓ client@xxx.fr onboarded.
   ```

3. **Connecter Amazon Logistics** (le vrai boulot concierge) :

   a. Demander au client ses cookies Amazon Logistics via un mail type :
      ```
      Pour connecter ton compte Amazon Logistics à DSPilot, j'ai besoin de
      tes cookies de session. 2 min :
      
      1. Installer l'extension Chrome "EditThisCookie"
      2. Aller sur https://logistics.amazon.com
      3. Se connecter normalement
      4. Cliquer sur l'icône EditThisCookie en haut à droite
      5. Cliquer "Export" (bouton flèche sortante)
      6. M'envoyer le JSON copié par Telegram/mail
      
      Je m'occupe du reste.
      ```

   b. Quand tu reçois le JSON :
      ```bash
      ssh openclaw
      # Créer le profil client
      mkdir -p /root/.openclaw/workspace-dspilot-client-XXX/state/amazon-browser-profile
      # Poser les cookies
      nano /root/.openclaw/workspace-dspilot-client-XXX/state/amazon-automation/amazon-cookies.json
      # (coller le JSON)
      # Test session
      cd /root/DSPilot
      AMAZON_LOGISTICS_COOKIES_FILE=/root/.openclaw/workspace-dspilot-client-XXX/state/amazon-automation/amazon-cookies.json \
      python3 /root/.openclaw/workspace-dspilot/scripts/amazon-session-manager.py --check
      ```

   c. Lancer premier scrape manuel :
      ```bash
      # (la bonne cli qui trigger un import ad-hoc pour cette station — à coder proprement plus tard ;
      # pour l'instant on peut juste ajouter la station au cron amazon-unified)
      ```

4. Quand le premier import est terminé (DWC + DNR présents pour la semaine) :

   - Se connecter à dspilot.fr en tant que le client (ou via org switcher)
   - Vérifier que le dashboard rend correctement
   - Mettre `initialSetupStatus: "ready"` via convex dashboard UI (ou une mutation à créer)
   - Envoyer un mail : "C'est prêt ! Connecte-toi sur dspilot.fr avec le lien qu'on t'a envoyé par mail."

---

## 6. Après 24h — suivi

- [ ] Vérifier que le client s'est bien connecté (Clerk dashboard → Users → `last_active`)
- [ ] Si non connecté J+2 → relance mail ("tout va bien ? Tu as trouvé le mail d'invitation ?")
- [ ] Demander feedback à J+7 : "Qu'est-ce qui t'a le plus marqué ? Qu'est-ce qui te manque ?"

---

## 7. Actions à coder plus tard (post-ship)

- `scripts/mark-setup-ready.ts` : CLI pour flip `initialSetupStatus` à `ready`
- `scripts/cancel-onboarding.ts` : rollback complet (delete org + station + refund)
- Admin UI `/admin/onboardings` : liste des clients avec leur `initialSetupStatus` + bouton "trigger setup"
- Self-serve signup `/pricing` → Stripe Checkout (remplace Payment Link statique)
- Email automatique post-payment (Resend) avec lien direct Clerk invitation

---

## 8. Contacts & accès

- **Stripe dashboard** : https://dashboard.stripe.com
- **Clerk dashboard** : https://dashboard.clerk.com → instance DSPilot prod
- **Convex dashboard** : https://dashboard.convex.dev/d/sincere-rhinoceros-718
- **Vercel dashboard** : https://vercel.com/ousmanes-projects-239e9b94/dspilot
- **VPS** : `ssh openclaw` (Hetzner, `/root/DSPilot` + `/root/.openclaw/workspace-dspilot`)
- **Cal.com** : https://app.cal.com

---

## 9. Clés d'identité importantes (à toujours avoir sous la main)

- Ousmane Clerk user id : `user_37Yc8YaEuX9hxXzeZZzGlytEFeC`
- Ami DSP (potentiel 2ème client) : `user_37Yc0VuRSNZJsRWvbZvHMS6jUDq`
- Station DIF1 prod : `m5793emg00bwkq7n082dyrp4kd841cak` (code `FR-PSUA-DIF1`)
- Demo tenant : org `org_3Ci0CbUxtClgeZPLcSFBRclJ290`, station `m570aqgfarsyqrfmzsjnm135th85aja5`
- Convex prod URL : `https://sincere-rhinoceros-718.convex.cloud`
- Convex dev URL : `https://pastel-snail-181.convex.cloud`

---

**En cas de blocage pendant un onboard** :
- Relancer la commande avec `--dry-run` pour voir ce qui a déjà été créé
- Inspecter `https://dashboard.convex.dev/d/sincere-rhinoceros-718/data/stations` pour voir si la station est là
- Voir `stripeEvents` table pour vérifier que le webhook a bien reçu
