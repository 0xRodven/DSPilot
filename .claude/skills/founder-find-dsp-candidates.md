---
name: find-dsp-candidates
description: Find Amazon DSP candidate companies in France via legal data (data.gouv MCP — Annuaire des Entreprises officiel). Filter by APE 4941B + proximity to Amazon stations. Use when Ousmane asks "trouve-moi des DSP", "génère la liste IDF", "qui prospecter cette semaine".
---

# find-dsp-candidates — pipeline data DSP France

## Quand l'utiliser

- "Trouve-moi 50 DSP candidats IDF"
- "Liste les sociétés transport autour d'Orly"
- "Qui prospecter en Hauts-de-France cette semaine"
- "Génère le CSV des prospects mois 1"

## Stack data publique (RGPD-clean, 100% gratuit)

1. **data.gouv MCP** ⭐ source primaire — Annuaire des Entreprises (État FR), wraps INSEE SIRENE + dirigeants principaux
2. **Adresse.data.gouv.fr (BAN)** — geocoding adresses siège, gratuit
3. **Pages Jaunes** (scraping doux, 1 req/s) — téléphone société
4. **Hunter.io free tier** — 25 searches + 50 verifications/mois pour emails pro
5. **Apollo MCP free tier** — 10k credits/mois pour enrichissement email + LinkedIn

> **Pappers skippé** : free trial épuisé, Pro 49€/mois pas justifié au stade actuel. data.gouv couvre ~80% des besoins. Si on a besoin de BODACC mention Amazon Logistics plus tard, on prend Pay-as-you-go Pappers (~10€) ad hoc.

## Pipeline 4 étapes

### Étape 1 — Longue liste via data.gouv MCP

Query type sur l'agent :

```
Search annuaire-entreprises (data.gouv MCP) avec filtres :
- APE / NAF : 4941B  ("Transports routiers de fret de proximité")
- Localisation : départements [75, 77, 78, 91, 92, 93, 94, 95]  (IDF)
- Date de création : >= 2018-01-01
- Effectif salarial : tranche [10-49] ou [50-249]
- État administratif : Actif

Return : SIREN | dénomination | adresse_siege | code_postal | date_creation | effectif | activite_principale
```

Output attendu : 200-1000 sociétés brutes IDF.

**Codes APE secondaires à ajouter si volume insuffisant** :
- 4941A "Transports routiers de fret interurbains"
- 5320Z "Autres activités de poste et de courrier"
- 5229B "Affrètement et organisation des transports"

### Étape 2 — Filtrage géo proximité station Amazon

Stations Amazon Logistics France connues à privilégier (rayon 30km) :

```python
STATIONS_AMAZON = {
    "FR-PSUA-DIF1":  ("Ivry-sur-Seine",   48.8127, 2.3870),
    "FR-PSUA-CDG10": ("Clichy",           48.9047, 2.3036),
    "FR-PSUA-ORY1":  ("Saran",            47.9620, 1.8836),
    "FR-PSUA-LYS1":  ("Saint-Quentin-Fallavier", 45.6300, 5.0900),
    "FR-PSUA-MRS1":  ("Vitrolles",        43.4500, 5.2500),
    "FR-PSUA-LIL1":  ("Lauwin-Planque",   50.4100, 3.0700),
    "FR-PSUA-BOR1":  ("Cestas",           44.7500, -0.6800),
    "FR-PSUA-NTE1":  ("Carquefou",        47.2900, -1.4700),
    "FR-PSUA-BIA1":  ("Boves",            49.8400, 2.4000),
    "FR-PSUA-LON1":  ("Senlis",           49.2000, 2.5800),
}
```

Pour chaque société :
1. Geocode `adresse_siege` via BAN → (lat, lng)
2. Calcul distance haversine vers chaque station
3. Garder si distance min < 30 km

```python
from math import radians, sin, cos, asin, sqrt

def haversine(lat1, lng1, lat2, lng2):
    R = 6371  # km
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    dlat, dlng = lat2 - lat1, lng2 - lng1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
    return 2 * R * asin(sqrt(a))
```

→ Réduction ~1000 → ~150 candidats géo-pertinents.

### Étape 3 — Enrichissement dirigeants via data.gouv MCP

Pour chaque candidat shortlisté, query data.gouv :

```
data.gouv MCP : annuaire_entreprises.detail(siren=$SIREN)
Return : raison_sociale, dirigeants[{prenom, nom, fonction, annee_naissance}],
         capital_social, tranche_effectif, etat_administratif, etablissements
```

**Filtre dirigeant cible** : `fonction in ["Président", "Gérant", "Directeur Général", "Co-gérant"]`. Exclure les commissaires aux comptes.

**Note** : data.gouv ne fournit pas BODACC ni comptes annuels détaillés (≠ Pappers). Pour signaux "Amazon Logistics" mention BODACC, fallback manuel via `bodacc.gouv.fr` (search public, gratuit) si Étape 4 score borderline.

### Étape 4 — Validation "vraiment DSP Amazon ?"

Heuristique pour shortlister à 50 vrais DSPs :

| Signal positif | Poids |
|---|---|
| BODACC mentionne "Amazon Logistics" / "DSP" / "Delivery Service Partner" | +5 |
| Siège dans parc d'activité contigu station Amazon (< 5 km) | +3 |
| Date création 2018-2023 (alignée programme DSP) | +2 |
| Effectif 30-150 salariés (taille typique DSP) | +2 |
| LinkedIn entreprise mentionne Amazon | +3 |
| Glassdoor avis évoquent Amazon | +2 |
| Ousmane reconnaît le nom | +5 |

**Score >= 5 → DSP candidate confirmé**.

**Filtre négatif** : CA > 10M€ → société trop grosse, pas le profil cible Pro 499€.

## Output format

CSV ou markdown table dans `/Users/ousmane/wiki/wiki/leads-DSPilot.md` :

```markdown
| SIREN | Société | Dirigeant | Adresse | Station | Score | Stage | Phone | Email |
|---|---|---|---|---|---|---|---|---|
| 901234567 | TRANSPORT XYZ | M. Dupont (Gérant) | 12 rue de Paris, 94 Ivry | DIF1 | 8/15 | Lead | 01 41... | dupont@xyz.fr |
```

## Skill à appeler ensuite

Pour chaque candidat retenu, déclencher `enrich-prospect.md` (Hunter + Apollo) pour validation email + téléphone avant outreach.

## Règles importantes

- **JAMAIS scrape massif** sans User-Agent identifiable (DSPilot/1.0 contact: ousmane@dspilot.fr)
- **Stocker SIREN comme clé** (immuable) — le nom de société peut changer (BODACC)
- **`adresse_siege` est OK pour outreach**, jamais l'adresse personnelle dirigeant (RGPD)
- **Append au wiki tracker** via skill `wiki-append.md` après chaque batch
- **Refresh tous les 30 jours** : nouvelles sociétés créées, certaines cessent activité

## Exemple de session agent

```
USER: Trouve-moi 50 DSP candidats IDF cette semaine

AGENT: J'utilise le pipeline find-dsp-candidates.
  ✓ data.gouv: 743 sociétés APE 4941B en IDF
  ✓ Filtrage géo (30km stations Amazon): 156 candidats
  ✓ data.gouv: dirigeants enrichis (illimité, gratuit)
  ✓ Score >=5 sur 50 candidats validés
  → CSV ajouté à wiki/leads-DSPilot.md
  
  Top 5 par score:
  1. TRANSPORT BERTRAND SAS — Ivry — Score 12 (BODACC Amazon + ex-Paritrans réseau)
  2. CIE LOGISTIQUE PARIS EST — Clichy — Score 11
  3. ...
  
  Lance phase outreach (skill phone-script-fr) ?
```
