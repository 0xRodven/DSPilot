---
name: enrich-prospect
description: Enrich a single DSP prospect — combine data.gouv (legal + dirigeants) + Hunter.io (email domain) + Apollo (verified email) + Pages Jaunes (phone). Use when user asks "enrichis [Société]" or before launching outreach on a fresh lead.
---

# enrich-prospect — enrichissement données 1 prospect

## Quand l'utiliser

- "Enrichis Paritrans avec tous les contacts dispos"
- "Donne-moi tout ce que tu peux sur SIREN 901234567"
- "Avant que j'appelle [Société] demain matin, prépare la fiche complète"

## Pipeline d'enrichissement (4 étapes, < 2 min)

### Étape 1 — Identité société (data.gouv MCP)

```
data.gouv MCP : annuaire_entreprises.search(siren=$SIREN)
Return : {
  denomination, sigle, raison_sociale,
  siege: { adresse, code_postal, ville, departement },
  date_creation, date_radiation_bodacc,
  effectif_tranche, ca_dernier_exercice,
  apenaf_principal, naf_libelle,
  forme_juridique, capital_social,
  etat_administratif: actif|cesse,
  etablissements: [{ siret, adresse, principal: bool }]
}
```

### Étape 2 — Dirigeants principaux (data.gouv MCP)

```
data.gouv MCP : annuaire_entreprises.dirigeants(siren=$SIREN)
Return : {
  dirigeants: [
    {
      prenom, nom, fonction,
      annee_naissance,           // pas la date complète (RGPD INSEE)
      nationalite,
      qualite                    // PP (personne physique) ou PM (personne morale)
    }
  ]
}
```

**Note RGPD** : data.gouv ne retourne que l'année de naissance (pas la date), c'est suffisant pour estimer l'âge à ±1 an.

**Filtrer** : ne garder que les dirigeants avec `fonction in ["Président", "Gérant", "Co-gérant", "Directeur Général", "Président-Directeur Général"]`.

**Score profil** :
- < 35 ans → tutoyer + Variant 1
- 35-50 ans → tutoyer + Variant 1 ou 3
- 50+ ans → vouvoyer + Variant 2

### Étape 3 — Téléphone société (Pages Jaunes + site web)

Ordre de priorité :

1. **Pages Jaunes** : recherche `{denomination} + {ville}` → numéro standard (gratuit, scrape doux 1 req/s)
2. **Site web société** : scrape page `/contact` ou `/mentions-legales` (souvent le plus fiable car déclaratif)
3. **Google search** : `"{denomination}" "{ville}" telephone` → trouve souvent le numéro dans les annuaires tiers
4. **Apollo** : `phone` field si dirigeant trouvé dans la base Apollo (rarement présent pour SARL transport FR)

**Format normalisé** : `+33 1 XX XX XX XX` (uniformiser avec +33).

### Étape 4 — Email pro (Hunter + Apollo + heuristique)

Ordre :

1. **Hunter.io** (free tier 25 searches/mois) :
   - `domain_search(domain=$societe_domain)` → liste emails publics du domaine
   - `email_finder(first_name=$prenom, last_name=$nom, domain=$societe_domain)` → email + score
   
2. **Apollo** (free tier, 10k credits/mois) :
   - `people_match(first_name=$prenom, last_name=$nom, organization_name=$societe)` → email vérifié si dans la base

3. **Heuristique patterns FR** (si Hunter/Apollo échouent, génère candidats à valider) :
   - `prenom.nom@societe.fr`
   - `prenom@societe.fr`
   - `pnom@societe.fr` (initiale + nom)
   - `gerant@societe.fr` / `direction@societe.fr` / `accueil@societe.fr` / `contact@societe.fr`
   
   Hunter.io `email_verifier` (free tier 50/mois) pour valider les patterns avant outreach.

**Si aucun email validé** : marquer prospect "tel-only", skip canal email.

## Format de sortie standard (1 fiche enrichie)

```markdown
## TRANSPORT BERTRAND SAS

**Identité** (source: data.gouv)
- SIREN : 901234567
- Forme : SAS, capital 50 000 €
- APE : 4941B (Transports routiers de fret de proximité)
- Création : 2019-03-15 — 5 ans
- Effectif : 30-49 salariés (tranche INSEE)
- CA dernier exercice : 2.4 M€ (2024)
- État : Actif

**Siège** (source: data.gouv + BAN)
- 12 Rue de la Logistique, 94200 Ivry-sur-Seine
- Coordonnées : 48.8127, 2.3870
- Distance station Amazon DIF1 : **1.8 km** ⭐ contigu

**Dirigeant cible** (source: data.gouv)
- M. Jean-Marc DUPONT
- Fonction : Président
- Né le 1972-08-14 (52 ans → vouvoyer, Variant 2)
- En fonction depuis 2019-03-15

**Contact**
- Téléphone société : +33 1 49 60 XX XX (source: Pages Jaunes)
- Email pro : j.dupont@transport-bertrand.fr (Hunter score: 89/100, valide)
- Backup : direction@transport-bertrand.fr

**Signaux DSP Amazon** (heuristique)
- ✅ BODACC 2022 mentionne "contrat Amazon Logistics" (+5)
- ✅ Siège dans parc Ivry < 5km DIF1 (+3)
- ✅ Création 2019 (cohérent programme DSP) (+2)
- ✅ Effectif 30-49 (taille DSP typique) (+2)
- ❌ LinkedIn entreprise inexistant (0)
- ❓ Ousmane reconnaît le nom ? (à confirmer)
- **Score : 12/15** → DSP confirmé high-confidence

**Action recommandée**
- Variant : 2 (vouvoyer, dirigeant 52 ans)
- Hook : "On est voisins de station — DIF1 vs DIF1, j'aimerais comprendre comment vous gérez votre coaching"
- Canal primaire : téléphone (mardi 10h ou jeudi 14h)
- Canal secondaire : email j.dupont@... après appel manqué
- Première action : appel demain 10h30
```

## Limites quotas free tier (à monitorer)

| Service | Quota free | Reset | Stratégie |
|---|---|---|---|
| data.gouv MCP | Illimité | — | Source primaire (identité + dirigeants) |
| Hunter.io | 25 searches + 50 verifications | Mensuel | Garder pour les top 25 prospects |
| Apollo MCP | 10 000 credits | Mensuel | Large marge, OK pour batch |
| Pages Jaunes | Public | — | Scrape doux (rate limit 1 req/s) |

## Append au tracker

Après chaque enrichissement réussi, l'agent doit appeler `wiki-append.md` pour ajouter une row dans `/Users/ousmane/wiki/wiki/leads-DSPilot.md` avec stage = "Enriched, ready to call".

## Erreurs courantes à éviter

- ❌ **Confondre `siege` et `etablissements`** : un même SIREN peut avoir 5+ établissements. Toujours filtrer `principal: true`.
- ❌ **Stocker l'adresse perso du dirigeant** : certaines bases retournent `domicile_dirigeant` — RGPD-non. Utiliser uniquement `adresse_siege`.
- ❌ **Considérer "absence d'email" = pas joignable** : 80% des SARL transport FR n'ont pas d'email pro propre — le téléphone est le canal principal.
- ❌ **Spam Hunter avec 50 lookups same domain** : un seul `domain_search` retourne tous les emails publics du domaine, pas besoin d'itérer.
- ❌ **Trust blind email enrichi** : toujours vérifier via Hunter.io `email_verifier` avant d'envoyer (évite bounces qui pourrissent ton domaine sender).
