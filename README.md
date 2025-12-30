# DSPilot

Plateforme SaaS de gestion des performances livreurs Amazon (DWC/IADC).

## Stack

- **Frontend**: Next.js 15 + React 19
- **Backend**: Convex (temps réel)
- **Auth**: Clerk
- **Styling**: Tailwind CSS + shadcn/ui
- **Deploy**: Vercel

## Setup Local

```bash
# 1. Cloner le repo
git clone <repo-url>
cd DSPilot

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Ajouter les clés Clerk et Convex

# 4. Lancer Convex (backend)
npx convex dev

# 5. Lancer Next.js (dans un autre terminal)
npm run dev
```

L'app sera accessible sur [http://localhost:3005](http://localhost:3005)

## Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement (Next.js + Convex) |
| `npm run build` | Build production |
| `npm run lint` | ESLint |
| `npx convex dev` | Convex dev server |
| `npx convex deploy` | Déployer Convex en prod |

## Structure

```
/src
├── app/(main)/dashboard/   # Pages principales
│   ├── page.tsx            # Dashboard
│   ├── drivers/            # Liste et détail livreurs
│   ├── errors/             # Erreurs livreurs
│   ├── coaching/           # Actions coaching
│   ├── import/             # Import données Amazon
│   └── settings/           # Paramètres station
├── components/
│   ├── dashboard/          # Composants métier
│   └── ui/                 # shadcn/ui
└── lib/
    ├── store.ts            # State Zustand
    ├── types.ts            # Types TypeScript
    └── utils/              # Utilitaires

/convex
├── schema.ts               # Schema base de données
├── drivers.ts              # Queries/Mutations livreurs
├── weeklyStats.ts          # Stats hebdo
├── coaching.ts             # Actions coaching
└── ...
```

## Documentation

- **Code style**: voir `CLAUDE.md`
- **Tests**: voir `tests/` et commandes `/test-*`

## Environnement

Variables requises (voir `.env.example`):
- `NEXT_PUBLIC_CLERK_*` - Configuration Clerk
- `CONVEX_DEPLOYMENT` - ID déploiement Convex
- `NEXT_PUBLIC_CONVEX_URL` - URL Convex
