---
name: draft-email-outreach
description: Draft cold outreach emails (FR) for DSP managers in France — intro, follow-up, closing, post-demo. Use when user asks "écris un email", "draft un cold email", "relance", "mail à envoyer au DSP X".
---

# draft-email-outreach — emails B2B FR

## Quand l'utiliser

- "Draft un cold email pour DSP Orly"
- "Relance J+3 pour Thierry"
- "Mail post-démo pour closer"
- "Email pour inviter [prénom] à tester DSPilot"

## Règles du jeu (ton Ousmane, 2026)

- **Tu** (jamais vous) — DSP managers FR entre 30 et 50 ans, tonalité directe
- **Court** : 80-150 mots idéalement, jamais > 200
- **Un seul CTA** par email
- **Pas de jargon corporate** ("synergies", "leverage", "win-win" → NO)
- **Signature** : Ousmane / DSP DIF1 / dspilot.fr
- **Subject line** qui dit clairement l'objet ou pose une question

## Templates

### A. Cold email intro (découverte via LinkedIn / Apollo)

**Subject** : `{Prénom}, comment tu piloter DWC de ta station ?`

```
{Prénom},

Vite fait — je m'appelle Ousmane, DSP manager station DIF1 (Paris Sud,
114 livreurs).

J'ai construit un outil pour éviter les 10h/semaine de spreadsheets
Amazon Logistics. Il s'appelle DSPilot.

Deux trucs clés :
1. Dashboard temps réel — tu vois direct les livreurs < 88% DWC
2. Un agent Telegram qui répond 24/7 : "DWC de Kitenge S17 ?"

Screenshots live : https://dspilot.fr/demo

Tu veux que je te montre en 20 min ? Mon Cal :
https://cal.com/dspilot/30min

Ousmane
DSP DIF1 · dspilot.fr
```

### B. Follow-up J+3 (pas de réponse au cold email)

**Subject** : `Re: {Prénom}, comment tu piloter DWC de ta station ?`

```
{Prénom},

Tu as sûrement pas eu le temps.

Question simple : tu passes combien d'heures par semaine à compiler
du DWC/IADC/DNR dans Excel ou Google Sheets actuellement ?

Si c'est > 3h, on peut discuter 15 min pour voir si DSPilot
te ferait gagner du temps. Si c'est < 1h t'as déjà une solution
qui tient, ignore ce mail.

Mon Cal : https://cal.com/dspilot/30min

Ousmane
```

### C. Email post-démo (closer)

**Subject** : `{Prénom}, concrètement — on active DSPilot pour toi ?`

```
{Prénom},

Merci pour l'échange de ce matin. Petit récap de ce qu'on a vu :

• Pour ta station {NomStation}, tu passerais de ~Xh/sem à <1h/sem
  sur le monitoring livreurs
• ROI dès la 1ère semaine (vs 499€/mois de l'abonnement Pro)
• Setup sous 24h, je m'occupe de tout (cookies Amazon + première
  ingestion)

Prêt à tester ?

Voici le lien de paiement : {LIEN_STRIPE_PRO_MONTHLY}

Dès que tu payes je te setup dans la journée. Tu me dis.

Ousmane
```

### D. Email de relance post-démo (J+3 sans réponse)

**Subject** : `{Prénom}, une question avant que tu décides`

```
{Prénom},

Je comprends, c'est une décision.

Une seule question pour avancer : qu'est-ce qui te retient exactement ?

- Le prix (499€ te paraît trop / pas assez) ?
- La confiance (t'as besoin de voir plus de preuves) ?
- Le timing (pas maintenant, plutôt Q3) ?
- Un truc technique qu'on a pas abordé ?

Dis-moi franchement — je m'adapte ou je te laisse tranquille.

Ousmane
```

### E. Email onboarding J+1 (après payment reçu)

**Subject** : `{Prénom}, ton compte DSPilot est prêt`

```
{Prénom},

Paiement bien reçu, bienvenue sur DSPilot.

J'ai créé ton compte + setup initial. Voici ce qui se passe maintenant :

1. Tu reçois un mail Clerk dans les prochaines minutes → clique,
   crée ton mot de passe, tu atterris sur ton dashboard.
2. Pour la première ingestion Amazon, j'ai besoin de tes cookies
   session. C'est 2 min :
   - Install extension Chrome "EditThisCookie"
   - Va sur logistics.amazon.com (connecté)
   - Click l'icône extension → Export → m'envoie le JSON par Telegram
3. Je lance le premier scrape dans les 24h. Tu reçois un mail
   "C'est prêt" quand ton dashboard est plein.

Des questions ? Réponds directement.

Ousmane
+33 X XX XX XX XX (dispo 8h-20h)
```

### F. Email referral (demande de parrainage à un client satisfait)

**Subject** : `{Prénom}, une toute petite question`

```
{Prénom},

Merci pour ton feedback la semaine dernière, content que DSPilot
tourne bien chez toi.

J'active un petit programme de parrainage pour les early users :
si tu connais un autre DSP en France à qui ça pourrait servir
et que tu nous mets en contact → **1 mois gratuit pour toi + 1
mois gratuit pour lui** sur son premier mois.

Aucune obligation, juste si quelqu'un te vient spontanément en tête.

Ousmane
```

### G. Email réponse à un journaliste (PR press)

**Subject** : `Re: {sujet de leur article}`

```
{Prénom},

Merci pour l'intérêt. Avec plaisir pour une interview.

Pour te donner un angle concret : DSPilot est utilisé aujourd'hui
par {X} stations DSP Amazon en France, dont la mienne (DIF1, 114
livreurs, Paris Sud). Le cas d'usage principal : réduire les
10h/semaine que les DSP managers passent à compiler des chiffres
dans Excel.

Disponibilités sur la semaine prochaine (choisis) :
- Mardi 10h-11h
- Mercredi 14h-15h
- Jeudi 16h-17h

Mon Cal si tu préfères : https://cal.com/dspilot/30min

Je peux préparer un deck avec des chiffres concrets et des
screenshots du produit si besoin.

Ousmane
DSP manager DIF1 + founder DSPilot
+33 X XX XX XX XX
```

## Anti-patterns

- ❌ "J'espère que ce mail vous trouve bien"
- ❌ "Nous avons le plaisir de vous présenter"
- ❌ "Cordialement" (trop formel) — utiliser juste prénom
- ❌ Bullet points longs de fonctionnalités (jamais > 3 items)
- ❌ Mentionner "AI / IA / machine learning" dans le cold — ça déclenche le filtre spam chez les DSP old-school

## Output format

Envoie le draft sur Telegram :

```
Draft email {type}. Remplace {Prénom}, {NomStation} et ajuste le Cal link avant d'envoyer.

---SUJET---
{subject line}

---CORPS---
{body}
---FIN---
```
