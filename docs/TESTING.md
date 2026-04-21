# DSPilot — Guide testeur

Comment accéder à DSPilot en tant que nouveau testeur.

## 1. Création du compte

1. Va sur **https://dspilot.fr/sign-up**
2. Crée ton compte (email + mot de passe ou Google)
3. Vérifie ton email (Clerk envoie un code)

## 2. Création de l'organisation

Après la vérification, Clerk te demande de :
- **Créer une organisation** (ex: "Ma Station Test")
- OU accepter une invitation d'Ousmane pour rejoindre une org existante

Pour les tests, Ousmane t'envoie directement l'invitation à l'org DSPilot-DIF1.
Accepte-la dans l'email Clerk.

## 3. Premier accès au dashboard

- Tu arrives sur **/dashboard**
- La station est automatiquement synchronisée avec ton organisation Clerk
- Si c'est une nouvelle org sans données : skeletons vides (normal)
- Si c'est DIF1 (testeur) : tu vois les données réelles S17/2026

## 4. Que tester ?

### Pages principales
- [ ] `/dashboard` — KPIs, chart performance, top livreurs, répartition
- [ ] `/dashboard/drivers` — Table livreurs avec filtres (nom, rang, DWC)
- [ ] `/dashboard/drivers/[id]` — Fiche détail livreur + daily performance + rapports hebdo en bas
- [ ] `/dashboard/dnr` — DNR de la semaine (clique sur une ligne → sheet détail avec map + note client)
- [ ] `/dashboard/coaching` — Actions coaching
- [ ] `/dashboard/reports` — 4 onglets : Tous / Hebdo / Quotidien / Livreurs (search par nom)
- [ ] `/dashboard/warnings` — Avertissements actifs
- [ ] `/dashboard/stats` — Statistiques
- [ ] `/dashboard/settings` — Paramètres org

### Actions à tester
- [ ] **Switch de semaine** (haut à droite : "Semaine 17 • 2026")
- [ ] **Switch de station** (si tu as plusieurs orgs)
- [ ] **Recherche par livreur** sur /dashboard/reports onglet Livreurs
- [ ] **Cliquer une DNR** → voir la map + adresse + note client
- [ ] **Planifier un coaching** depuis la fiche livreur
- [ ] **Évaluer un coaching** existant (résultat amélioré / sans effet → escalade)

### Ce qui est automatisé (à vérifier demain matin)
- **Amazon scrape** : 04h30 UTC tous les jours (DWC + DNR)
- **Rapport quotidien** : 06h00 UTC tous les jours → /dashboard/reports onglet Quotidien
- **Rapport hebdomadaire** : Lundi 11h30 UTC → /dashboard/reports onglet Hebdo
- **Rapports livreurs** : Lundi 11h30 UTC → /dashboard/reports onglet Livreurs (56+ rapports perso)

## 5. Bugs à signaler

Si quelque chose casse :
1. Ouvre la console navigateur (Cmd+Option+J sur Mac)
2. Screenshot de la page + console
3. Envoie à Ousmane avec :
   - URL
   - Semaine sélectionnée
   - Action qui a déclenché le bug
   - Heure (UTC)

## Architecture rapide

- **Frontend** : Next.js 16 + React 19 déployé sur Vercel (dspilot.fr)
- **Backend** : Convex prod `sincere-rhinoceros-718.convex.cloud`
- **Auth** : Clerk avec organisations multi-tenant
- **Scraper** : VPS Hetzner via systemd timers (Amazon Logistics)
- **Rapports IA** : Claude Code Routines cloud (Opus 4.7)
