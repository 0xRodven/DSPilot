# Task 12: Déploiement Vercel

## Phase
Phase 4 - Déploiement

## Priorité
HAUTE (quand MVP terminé)

## Objectif
Déployer l'application en production sur Vercel

## Prérequis

- [ ] Compte Vercel
- [ ] Projet Convex en production
- [ ] Clerk en production
- [ ] Domaine (optionnel)

## Steps

### 1. Préparer Convex pour Production

```bash
# Déployer Convex en production
npx convex deploy
```

Récupérer la `CONVEX_URL` de production.

### 2. Préparer Clerk pour Production

- Créer une instance Clerk de production
- Récupérer les clés de production
- Configurer les URLs de callback

### 3. Configurer Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Lier le projet
vercel link

# Configurer les variables d'environnement
vercel env add CONVEX_DEPLOYMENT
vercel env add NEXT_PUBLIC_CONVEX_URL
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
```

### 4. Premier Déploiement

```bash
# Déployer
vercel

# Ou pousser sur main pour auto-deploy
git push origin main
```

### 5. Configurer le Domaine

```bash
# Ajouter domaine custom
vercel domains add dspilot.app
```

Configurer DNS:
- CNAME: `cname.vercel-dns.com`
- Ou A: IPs Vercel

### 6. Configuration vercel.json (optionnel)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["cdg1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### 7. Preview Deployments

Chaque PR créera automatiquement un preview deployment.

## Variables d'Environnement Production

| Variable | Description |
|----------|-------------|
| `CONVEX_DEPLOYMENT` | Convex deployment ID (prod) |
| `NEXT_PUBLIC_CONVEX_URL` | URL publique Convex |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key (prod) |
| `CLERK_SECRET_KEY` | Clerk secret key (prod) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |

## Acceptance Criteria

- [ ] App accessible sur URL Vercel
- [ ] Convex connecté en production
- [ ] Auth Clerk fonctionnelle
- [ ] HTTPS activé
- [ ] Preview deployments sur PR
- [ ] (Optionnel) Domaine custom configuré
