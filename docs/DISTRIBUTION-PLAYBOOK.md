# DSPilot — Playbook de distribution

> Comment trouver tes 100 premiers clients DSP France.
> MAJ 2026-04-22. À tester / itérer semaine par semaine.

---

## TL;DR — la séquence à 10 semaines

| Semaine | Focus | Volume cible |
|---|---|---|
| S1 | Warm leads perso (ton pote + patron) | 2 calls, 1-2 closes |
| S2 | 50 DSP FR identifiés, 20 contactés | 5 calls bookés |
| S3-S4 | Itération outbound LinkedIn + email | 10 closes total |
| S5-S8 | SEO + case studies, switch to inbound | 5-10 closes / semaine |
| S9-S10 | Référral loop activé | 15+ closes / semaine |

---

## 1. Sources pour trouver les DSP France

### A. Amazon (source officielle la plus propre)

1. **Amazon Station Locator** — chaque station DSP a un code (DIF1, ORY1, etc.)
   - URL : `https://logistics.amazon.com/station-locator` (nécessite compte Amazon)
   - Exploitable si on a un accès DSP (tu en as un)
   - Chaque station = 1 DSP owner + 1-5 DSP managers

2. **Amazon Delivery Service Partner** site officiel :
   - `https://logistics.amazon.fr/marketing/opportunity` — liste régions actives FR
   - Pas de listing public des DSP mais indique où ils opèrent

3. **Station code → Google** : `"DIF1" OR "FR-PSUA-*" DSP amazon logistics` souvent ramène le SIRET du DSP sur Pages Jaunes / Societe.com.

### B. LinkedIn (le gros volume)

**LinkedIn Sales Navigator** (29€/mois, incontournable) :
- Filtre : Titre = "DSP Owner", "Amazon DSP", "Delivery Service Partner", "Directeur Exploitation Amazon"
- Location = France
- Company size = 51-200
- Industry = Logistics, Transportation, Warehousing

Recherches types à sauvegarder :
1. `"DSP Amazon" AND (owner OR dirigeant OR président)` — France
2. `"Amazon Delivery Service Partner"` — France
3. `"station DIF1" OR "station ORY1" OR "station CDG1"` (teste 10 codes)
4. Post récents : "je cherche livreurs DSP" — les DSP qui recrutent activement

**LinkedIn gratuit** (sans Sales Nav) : fais des recherches manuelles + connexions ciblées. 10-15 par jour max pour ne pas flag.

### C. Facebook Groups FR

DSP managers sont très actifs dans ces groupes :
- "Livreurs Amazon France" (~15k membres)
- "Chauffeurs DSP Amazon" (~8k)
- "Entre DSP Amazon" (fermé, demande d'entrée)

Stratégie : poste de la valeur (screenshot dashboard anonyme, "voici le DWC de ma station cette semaine"), engage conversations, DM les actifs.

### D. Pages Jaunes / Societe.com / Infogreffe

Recherche par code APE :
- 4941B "Transports routiers de fret de proximité"
- Filtre géographique par région avec stations Amazon (IDF, Lyon, Marseille, Toulouse, Lille)

### E. Forums / Slack / Discord

- **r/AmazonDSPFrance** (Reddit, ~2k) — poster quand quelqu'un demande un dashboard
- **Discord "DSP Francophone"** (si existe, sinon le créer)
- **Slack "Entrepreneurs Logistique FR"** — pas DSP-spécifique mais utile

### F. Événements / salons (peu coûteux, bon ROI demo)

- **SITL Paris** (Semaine Intl Transport & Logistique, mars) — stand ou juste networking
- **Amazon Accelerate EU** (si version européenne existe)
- **DSP Summit Amazon** (US mais parfois rediffusé, regarder les speakers FR)

---

## 2. Outreach templates (à tester A/B)

### Template A — Cold LinkedIn (pote de pote, moins direct)

```
Salut {Prénom},

Je m'appelle Ousmane, je suis DSP manager station DIF1 (Paris Sud).
J'ai construit un outil pour piloter mes livreurs DWC/IADC et éviter
de passer 10h/semaine sur des spreadsheets.

Un de mes amis DSP l'utilise et me disait qu'il voulait que je te
montre : tu passes combien de temps par semaine sur Amazon Logistics
en ce moment ?

Pas de pitch, juste curieux.

Ousmane
```

### Template B — Cold email (après avoir trouvé l'email via Hunter.io / Apollo /
Societe.com)

Objet : `{Prénom}, comment tu piloter DWC de ta station ?`

```
{Prénom},

Vite fait — je suis DSP manager (DIF1), j'ai construit un outil pour
éviter les 10h/sem de spreadsheets.

Il s'appelle DSPilot. Deux trucs clés :
1. Dashboard temps réel — tu vois direct les livreurs < 88% DWC
2. Un agent Telegram qui répond 24/7 : "DWC de Kitenge S16 ?"

Screenshots : dspilot.fr/demo

Tu veux que je te montre 20 min ? Voici mon cal : [LIEN CAL.COM]

Ousmane
DSP DIF1
```

### Template C — Post LinkedIn (inbound)

```
Semaine 16 : DWC station 83.96%.

Dans la matinée : j'ai identifié 3 livreurs sous les 88%, envoyé
des actions coaching, vérifié les 102 DNR concessions, et composé
le rapport hebdo pour mon propriétaire.

Temps passé : 25 minutes.

L'année dernière à la même époque : 8 heures par semaine sur ces
mêmes tâches.

J'ai construit l'outil que j'aurais voulu avoir (DSPilot). Si t'es
DSP en France et que tu veux le voir, réponds à ce post je t'envoie
l'accès.
```

### Template D — Relance J+3 après démo

Objet : `Concrètement — on active DSPilot pour toi ?`

```
{Prénom},

Merci pour hier. Petit récap de ce qu'on a vu :
- Pour ta station {Nom}, tu passerais de ~8h/sem à <1h/sem sur
  le monitoring livreurs
- ROI semaine 1 (vs 499€ de Pro)
- Setup sous 24h, concierge de A à Z

Prêt à tester ?

Voici le lien de paiement : [Stripe Payment Link Pro Monthly]

Dès que tu payes, je te setup dans la journée. Tu me dis.

Ousmane
```

---

## 3. Outreach tracker — template (à copier dans Notion/Airtable)

| Nom | Station | Email | LinkedIn | Source | Étape | Date contact | Relances | Notes |
|---|---|---|---|---|---|---|---|---|
| Jean Dupont | FR-CDG-ORY1 | jean@xxx.fr | /in/jeandupont | LinkedIn Sales Nav | Lead | 2026-04-23 | | DSP 80 livreurs |
| ... | | | | | | | | |

**Étapes possibles** :
- `Lead` → juste identifié
- `Contacté` → premier message envoyé
- `Relancé-1` → 1ère relance à J+3
- `Call booké` → a cliqué sur Cal.com
- `Démo faite` → call effectué
- `En réflexion` → attente de décision
- `Closed won` → payé
- `Closed lost` → non intéressé

---

## 4. Métriques à tracker (weekly)

- `Nb leads identifiés` (par source)
- `Nb contactés` (par template)
- `Nb réponses` (taux de réponse par template A/B)
- `Nb calls bookés` (conversion lead→call)
- `Nb démos faites`
- `Nb closes` (conversion démo→paid)
- `Temps moyen démo→close` (en jours)
- `Revenue MRR` total + par plan

Objectif S4 : 10% réponse → 30% démo → 30% close = 1 close pour 111 contacts.

---

## 5. Automation outbound (post-ship)

Une fois stabilisé, automatiser :

- **Apollo.io Pro** (49€/mois) : 500 contacts/mois + email auto
- **Instantly.ai** ou **Lemlist** : séquences email 5 touches
- **Phantombuster** : scraper LinkedIn membres de groupes DSP FR

Budget mensuel marketing cible mois 2-3 : **~200€** (Apollo Pro + Lemlist).
ROI si 1 close/mois = 499€ MRR → rentable dès le 1er mois.

---

## 6. Référral program (activer dès S3)

> Un client existant qui te réfère un nouveau DSP → 1 mois gratuit pour les deux.

Mail type à envoyer à tes clients satisfaits :

```
Salut {Prénom},

Merci pour ton feedback la semaine dernière, content que DSPilot
tourne bien.

J'active un petit programme de parrainage pour les premiers utilisateurs :
si tu connais un autre DSP en France à qui ça pourrait servir et que
tu nous mets en contact → tu as 1 mois gratuit (et lui aussi sur son
1er mois).

Aucune obligation, juste si tu penses à quelqu'un spontanément.

Ousmane
```

---

## 7. Content marketing (post-S8)

Quand tu as 10+ clients, le content marketing commence à compenser
l'outbound :

- **Blog SEO** : "Comment améliorer son DWC de 3 points en 2 semaines",
  "Checklist du DSP manager le lundi matin", "DNR : comprendre les 3
  types de concessions"
- **LinkedIn** : posts hebdo avec graphiques anonymisés ("la station
  que je coach a gagné 2.1 points de DWC ce mois")
- **YouTube** : 1 vidéo tuto/mois ("comment je gère un livreur sous
  les 88% en 10 min avec DSPilot")

Objectif S10 : 30% des nouveaux clients viennent en inbound (SEO + social).

---

## 8. Red flags à éviter

- ❌ Spammer LinkedIn > 20 DM/jour → ban
- ❌ Envoyer des emails froids sans check SPAM / warm-up domain
- ❌ Faire de la démo à quelqu'un qui n'est pas DSP (taxi, VTC, fleet managers non-Amazon)
- ❌ Baisser ton prix pour closer — tu perds ton anchor 499€
- ❌ Promettre une feature Enterprise à un client Pro — dilue le tier

---

## 9. Contacts entreprises utiles (à construire au fil du temps)

- Amazon France — account manager DSP : (demande à ton own account manager)
- Fédération Française du Transport Express (FNE) : interlocuteur potentiel
- APEF (Association Professionnelle des Expressistes Français) : lobby du secteur

---

**Prochaine action (après les 2 warm leads demain)** :
1. Créer le compte LinkedIn Sales Navigator (14j gratuit trial)
2. Identifier 50 DSP managers FR en 2h
3. Envoyer 20 messages Template A LinkedIn d'ici J+2
4. Mesurer le taux de réponse → ajuster le template pour les 30 restants
