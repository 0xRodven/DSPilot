# DSPilot - Product Requirements Document (MVP)

## Vision Produit

DSPilot est une plateforme SaaS de gestion des performances pour les Delivery Service Partners (DSP) Amazon.
Elle permet aux managers de station de suivre, analyser et améliorer les performances DWC/IADC de leurs livreurs.

---

## Problème

Les managers DSP font face à plusieurs défis quotidiens:

1. **Analyse manuelle chronophage** - Des heures passées à extraire et analyser les rapports Amazon
2. **Manque de visibilité** - Pas de vue claire sur les tendances de performance
3. **Coaching non-suivi** - Difficile de mesurer l'efficacité des actions de coaching
4. **Identification tardive** - Les drivers à risque sont détectés trop tard

---

## Solution

Une plateforme centralisée qui:

1. **Importe automatiquement** les rapports Amazon (HTML DWC/IADC)
2. **Affiche des dashboards visuels** avec KPIs clés en temps réel
3. **Identifie proactivement** les drivers nécessitant du coaching
4. **Suit l'efficacité** des actions de coaching dans le temps

---

## Personas

### Persona Principal: Manager de Station DSP

| Attribut | Description |
|----------|-------------|
| **Profil** | Responsable d'une station Amazon (50-150 drivers) |
| **Objectifs** | Maintenir DWC >96%, réduire erreurs, coacher efficacement |
| **Douleurs** | Temps perdu sur Excel, manque de visibilité, coaching non-tracké |
| **Fréquence** | Utilisation quotidienne, import hebdomadaire |

---

## Fonctionnalités MVP

### F1 - Import de Données ✅ DONE

**Description**: Upload et parsing automatique des rapports Amazon

| Fonctionnalité | Status |
|----------------|--------|
| Upload fichier HTML | ✅ |
| Parsing automatique DWC/IADC | ✅ |
| Extraction des breakdowns | ✅ |
| Historique des imports | ✅ |
| Couverture semaines | ✅ |
| Preview avant confirmation | ✅ |

### F2 - Dashboard Principal ✅ DONE

**Description**: Vue d'ensemble des performances de la station

| Fonctionnalité | Status |
|----------------|--------|
| KPIs: DWC%, IADC%, Drivers, Alertes | ✅ |
| Distribution par Tier | ✅ |
| Evolution performance (graphique) | ✅ |
| Top/Bottom 5 drivers | ✅ |
| Top 5 erreurs | ✅ |
| Table complète des drivers | ✅ |

### F3 - Page Drivers ✅ DONE

**Description**: Liste et filtrage des drivers

| Fonctionnalité | Status |
|----------------|--------|
| Liste filtrable par tier | ✅ |
| Tri par DWC/IADC/nom | ✅ |
| Stats par tier (cards) | ✅ |
| Recherche par nom | ✅ |

### F4 - Page Driver Detail ⚠️ WIP

**Description**: Vue détaillée d'un driver individuel

| Fonctionnalité | Status |
|----------------|--------|
| Header avec infos driver | ⚠️ Mock data |
| KPIs individuels | ⚠️ Mock data |
| Historique performance (graph) | ⚠️ Mock data |
| Breakdown erreurs | ⚠️ Mock data |
| Historique coaching | ⚠️ Mock data |
| Performance quotidienne | ⚠️ Mock data |

**Action requise**: Connecter à Convex (Task 01)

### F5 - Analyse Erreurs ✅ DONE

**Description**: Analyse détaillée des types d'erreurs

| Fonctionnalité | Status |
|----------------|--------|
| Tabs DWC/IADC/False Scans | ✅ |
| KPIs par sous-catégorie | ✅ |
| Top drivers par type d'erreur | ✅ |
| Tendances (graphique) | ✅ |
| Drill-down par catégorie | ✅ |

### F6 - Coaching ✅ DONE

**Description**: Gestion des actions de coaching

| Fonctionnalité | Status |
|----------------|--------|
| Liste actions (cards) | ✅ |
| Création d'action | ✅ |
| Évaluation d'action | ✅ |
| Suggestions automatiques | ✅ |
| Métriques d'efficacité | ✅ |
| Filtrage par status | ✅ |

### F7 - Settings ⚠️ À FAIRE

**Description**: Configuration de la station et du compte

| Fonctionnalité | Status |
|----------------|--------|
| Info station (nom, code) | ⚠️ UI only |
| Compte utilisateur (Clerk) | ⚠️ UI only |
| Abonnement (Stripe) | ❌ Non implémenté |

**Action requise**: Implémenter les mutations Convex (Task 03)

---

## Classification des Tiers

| Tier | DWC% | Couleur |
|------|------|---------|
| Fantastic | ≥ 98.5% | Emerald |
| Great | ≥ 96% | Blue |
| Fair | ≥ 90% | Amber |
| Poor | < 90% | Red |

---

## Métriques de Succès MVP

| Métrique | Objectif |
|----------|----------|
| Temps d'import | < 10 secondes |
| Données temps réel | Refresh automatique Convex |
| Données hardcodées | 0 (tout via Convex) |
| Responsive mobile | Toutes pages |
| Score Lighthouse | > 90 |

---

## Hors Scope MVP

Les fonctionnalités suivantes sont reportées post-MVP:

- Multi-station avancé (switch entre stations)
- Export PDF/Excel des rapports
- Notifications email/push
- API publique REST/GraphQL
- SSO Enterprise
- Comparaison multi-drivers
- Prédictions ML
- Mode hors-ligne

---

## Roadmap Post-MVP

### Phase 2 - Q1 2026
- Export CSV/PDF
- Sélecteur de période avancé
- Comparaison de drivers

### Phase 3 - Q2 2026
- Multi-station complet
- Notifications
- API publique

### Phase 4 - Q3 2026
- Analytics avancés
- Prédictions ML
- Intégrations tierces
