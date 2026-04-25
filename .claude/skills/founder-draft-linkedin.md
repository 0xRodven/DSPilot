---
name: draft-linkedin
description: Draft a LinkedIn post in French for Ousmane (DSP manager + DSPilot founder). Templates for weekly insights, product announcements, case studies, industry trends. Use when user asks "écris un post LinkedIn", "draft un LI", "post sur X".
---

# draft-linkedin — posts LinkedIn FR

## Quand l'utiliser

- "Draft un post LinkedIn sur nos 102 DNR S16"
- "Post sur le DWC 83.96% de DIF1 cette semaine"
- "Annonce DSPilot lance Cal.com booking"
- "Thread sur les 5 patterns que j'ai vu chez les DSP"

## Format standard (5 blocs)

```
[HOOK 1-2 lignes — chiffre choc ou contrarian take]

[STORY / CONTEXTE 3-5 lignes — expérience perso, problème concret]

[INSIGHT / APPRENTISSAGE 3-5 lignes — ce qu'on a compris]

[CALL TO ACTION 1 ligne — question ou invitation]

#DSP #AmazonLogistics #LastMile #Logistique #France
```

## Templates par type

### A. Weekly insights (données DSPilot)

```
Semaine 16 chez DIF1 : DWC station 83.96%. Soit 102 concessions DNR.

Vendredi matin, 25 min devant mon dashboard :
- Kitenge à 82.1% (-1.8 pts) → Contact Miss 18×
- Jamal à 84.6% → Unsuccessful Delivery 12×
- 36% des concessions concentrées sur le 75018

L'année dernière à la même époque je passais 8h par semaine à compiler
ces chiffres dans Excel. Aujourd'hui un coup d'œil et l'agent Telegram
me prépare le deck de coaching.

Les 3 chiffres qui comptent pour un DSP manager :
1. DWC station (not driver average)
2. DNR par scanType (où on perd)
3. Time to action (délai entre alerte et coaching envoyé)

Comment tu priorises ton lundi matin toi ?

#DSP #AmazonLogistics #LastMile
```

### B. Product launch / feature announcement

```
J'ai passé le weekend à coder un truc dont je rêve depuis 2 ans.

Problème : un DSP manager peut avoir 110 livreurs, et chaque semaine
il doit identifier qui dérape, pourquoi, et lancer du coaching.

Aujourd'hui sur DSPilot, tu envoies une question au bot Telegram :
"Top 5 drivers sous 88% S17 avec leur Contact Miss"

30 secondes plus tard → tableau + graphique + recommandations.

C'est pas magique, c'est juste :
- Un scraper Amazon Logistics qui tourne 24/7
- Convex en base
- Claude Opus 4.7 qui lit tes questions et écrit du code Python
  pour fabriquer le chart que tu veux

Ça a pris 3 mois. Et maintenant je ne rouvre plus jamais Excel.

Si t'es DSP manager en France et que ça t'intéresse → DM.

#Logistique #Amazon #IA #SaaS
```

### C. Case study / customer story (après premier client)

```
Mardi 14h je closais [prénom], DSP manager à [ville], sur DSPilot.

Jeudi 18h — 2 jours après — il m'envoyait :
"Putain, j'ai gagné 5h cette semaine."

Il avait utilisé l'agent Telegram pour :
- Sortir son top 10 Contact Miss sans ouvrir Amazon Logistics
- Générer un PDF driver report pour son owner
- Repérer un group stop qui pourrissait 4 livreurs

5h qu'il utilise maintenant pour coacher ses livreurs en rue, pas
à trier des données.

C'est pour ça que je construis DSPilot. Pas pour faire joli.
Pour rendre 5h à des gens qui gèrent 110 humains chaque semaine.

#DSP #LastMile #SaaS
```

### D. Contrarian / thought leadership

```
Opinion impopulaire :

La plupart des DSP managers en France utilisent encore Excel pour
tracker leur DWC. En 2026.

Pas parce qu'ils sont nuls. Parce que :
1. Amazon Logistics ne donne pas d'export API propre
2. Les outils "analytics" existants coûtent 2000€/mois
3. Les consultants BI ne connaissent rien au métier DSP

Résultat : 10h/semaine perdues à copier-coller.

On a un problème de verticalisation. Les outils horizontaux
(Metabase, Tableau) ne parlent pas DWC, IADC, DNR.

Il faut des outils construits PAR des DSP managers POUR des
DSP managers. C'est ce qu'on essaie de faire avec DSPilot.

Qui gère une station DSP et veut voir un outil dédié ? DM.

#DSP #Amazon #Logistique #SaaS
```

### E. Weekly wins thread (style Sahil Bloom / naval)

```
5 trucs que j'ai appris en construisant DSPilot cette semaine :

1. Les DSP managers cherchent pas "plus de features"
   → ils cherchent "moins d'Excel". Simplifier > étendre.

2. Un agent Telegram qui génère un chart en 30s bat
   n'importe quel dashboard web. Le terminal > le browser.

3. 102 DNR sur une station de 110 livreurs = 1 concession
   par livreur / semaine. C'est un plancher, pas un plafond.

4. Le vrai KPI c'est pas "DWC %" — c'est "time to coaching action
   après une baisse DWC". Détection rapide > mesure précise.

5. La meilleure UX d'un SaaS B2B, c'est de pouvoir poser
   ta question en langage naturel et recevoir la réponse
   EN IMAGE. Pas un tableau à scroller.

Reply si t'es DSP manager et tu veux voir DSPilot en action.

#DSP #AmazonLogistics #IA
```

## Règles

- **Ton Ousmane** : direct, tutoyer, pas corporate. Terme comme "putain", "nul", "Excel" = OK.
- **Toujours FR**, pas de franglais inutile ("pipeline" OK, "leverage" non)
- **Chiffres réels** de Convex, pas inventés
- **CTA discret** : une question ouverte ou "DM si curieux", jamais "Click here"
- **Hashtags** : 3-5 max. #DSP #AmazonLogistics #LastMile #Logistique #France #SaaS #IA
- **Mentions** : si on parle d'un outil concret, linker le compte (@gamma_app, @calcom, etc.)
- **Longueur** : 1200-1800 caractères optimal pour LinkedIn (algo favorise)

## Après génération

Envoie le draft sur Telegram dans un code block pour copy-paste facile :

```
Voici le draft LinkedIn. Copy-paste directement, ou tu me dis ce que tu veux ajuster (ton, longueur, angle).

---
[contenu post]
---
```
