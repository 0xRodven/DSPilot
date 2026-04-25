---
name: phone-script-fr
description: Phone outreach scripts FR for cold-calling DSP managers in France. 5 variants by profile + post-call wiki logging. Use when Ousmane asks "script appel pour [nom]", "draft argumentaire tel", "que dire à [profil]".
---

# phone-script-fr — scripts cold call DSP FR

## Quand l'utiliser

- "Script tel pour [Prénom Nom] qui dirige [Société]"
- "J'appelle qui demain, prépare-moi le pitch"
- "Comment je gère les objections type 'on a déjà un outil' ?"

## Règles d'or cold call FR — DSP managers

1. **Ne jamais commencer par "Je vous dérange ?"** — réponse automatique = "oui"
2. **Toujours dire qui tu es ET d'où tu viens** dans les 5 premiers secondes
3. **Tutoyer si < 45 ans, vouvoyer si 50+** (data Pappers `date_naissance`)
4. **Mentionner DIF1** dès la 2ème phrase — instaure crédibilité métier
5. **Demander 5 minutes**, pas plus — le manager est entre 2 tournées
6. **Si secrétaire** : demander le manager par son prénom + nom complet (preuve qu'on a fait nos devoirs)
7. **Plage horaire** : mardi-jeudi 10h-12h et 14h-16h. Évite lundi matin (ronde livreurs) et vendredi après 15h
8. **Maximum 2 tentatives** par numéro, espacées de 48h minimum

## Variant 1 — Dirigeant 30-45 ans, single-station

```
[Tu] Bonjour, c'est bien [Prénom] ?

[Toi] Salut [Prénom], c'est Ousmane à l'appareil. Je dirige aussi un DSP, station DIF1
à Ivry. J'ai chopé ton tel via Pappers — je t'appelle parce que j'ai construit un outil
qui me fait gagner 8h par semaine sur le coaching livreurs. J'aimerais savoir si t'as
les mêmes galères que moi.

[Si oui curiosité] Cool — t'aurais 20 minutes mardi prochain pour que je te montre
en partage d'écran ? Sans engagement.

[Si "ça m'intéresse pas"] OK, pas de souci. Une dernière question : tu passes combien
d'heures par semaine sur Excel pour suivre ton DWC ?
[→ si > 3h, recadrer "je peux te ramener à 30 min, je te montre"]
[→ si < 1h, "OK donc t'as déjà une solution qui tient, je te laisse tranquille"]
```

## Variant 2 — Dirigeant senior (50+), gérant historique

```
[Vous] Bonjour, je cherche M. [Nom Famille] s'il vous plaît.

[Lui] Bonjour Monsieur [Nom], je suis Ousmane, je dirige une station DSP Amazon en
région parisienne, à DIF1. Je vous contacte parce qu'on partage un sujet : la gestion
des erreurs de livraison et du coaching livreurs.

J'ai développé un tableau de bord qui m'a fait gagner 8 heures par semaine sur ces
sujets. Avant de pousser, j'aimerais d'abord comprendre comment vous gérez ça
aujourd'hui de votre côté. Vous auriez 5-10 minutes maintenant ou plus tard cette
semaine ?
```

## Variant 3 — Multi-station / groupe (3+ DSP sous une même structure)

```
[Tu] Bonjour [Prénom], c'est Ousmane Dia, DSP DIF1.

Je vous appelle parce que j'ai vu que [Société] couvrait [X stations]. Au-delà de
2-3 stations, le pilotage manuel devient un cauchemar — tu te retrouves à gérer
30+ tableurs Excel, et la perf d'une station impacte les autres dans les SLA Amazon.

J'ai construit un outil qui consolide les KPI de toutes tes stations sur un dashboard
unique, avec un agent IA qui répond aux questions de tes coordinateurs sur Telegram
24/7. Ça remplace 5-10h par semaine de boulot data.

Tu peux me consacrer 15 min cette semaine pour que je te montre en multi-station ?
```

## Variant 4 — Société récente (<2 ans, jeune dirigeant)

```
[Tu] Salut [Prénom], Ousmane à l'appareil — DSP DIF1 à Ivry.

T'as lancé [Société] il y a [X] ans, tu dois être en plein onboarding livreurs +
calage des process. Je suis passé par là il y a 18 mois.

J'ai construit un outil qui me dit chaque lundi matin "voilà tes 3 livreurs sous
les seuils, voilà ce qu'il faut leur dire". Ça t'éviterait de devoir tout réinventer
toi-même côté coaching.

20 minutes la semaine prochaine pour que je te montre le dashboard ? Sans engagement,
juste pour te donner les patterns que j'ai vus passer chez les autres DSP.
```

## Variant 5 — Réponse sec / refus rapide (recovery)

Si interlocuteur dit "Non merci" très vite (< 30 sec) :

```
[Tu] OK, je comprends. Juste avant qu'on raccroche : c'est quoi ta principale
frustration aujourd'hui dans le pilotage de tes livreurs ? Histoire que je note pour
améliorer mon produit.

[Si réponse courte mais utile] Merci, c'est précieux. Je te laisse mon contact
au cas où tu changes d'avis : ousmane@dspilot.fr — j'ai aussi un agent Telegram
@dspilotagent_bot qui répond à n'importe quelle question DSP, gratuit pour tester.
Bonne journée [Prénom].

[Si silence/agacement] Pas de souci, bonne journée.
```

## Objections fréquentes (et réponses)

| Objection | Réponse |
|---|---|
| "On a déjà un outil" | "Lequel ? J'aimerais savoir lequel marche bien chez vous, ça m'intéresse pour comparer" |
| "On utilise Excel et ça nous va" | "Ah ouais ? Combien d'heures par semaine ? Moi avant DSPilot j'étais à 8h, c'est pour ça que je l'ai construit" |
| "Combien ça coûte ?" | "499€/mois en Pro, 999€ en Business. Mais avant prix, est-ce que ça résout vos vrais problèmes ? On peut faire un démo de 20 min ?" |
| "Vous êtes lié à Amazon ?" | "Non, je suis indépendant — moi-même DSP DIF1. C'est un outil de DSP pour DSP, pas pushed par Amazon" |
| "Mes données chez vous ?" | "Vos données restent dans une base isolée par station, RGPD-compliant. Hébergé en Europe (Convex). Vous gardez la propriété, exportable à tout moment" |
| "Pas le temps là" | "Je comprends. Quand est-ce qu'on peut se rappeler ? Mardi à 14h ?" |
| "Envoyez-moi par mail" | "Oui je vous envoie le lien démo + Cal.com pour réserver. Prénom + Nom à quel email ?" |

## Post-call : log dans wiki

À la fin de chaque appel, l'agent doit appeler `wiki-append.md` pour mettre à jour `leads-DSPilot.md` :

```markdown
[2026-04-26 14:32] [SIREN] [Société]
- Stage : Contacté tel (1ère tentative)
- Dirigeant atteint : Oui / Non / Secrétaire
- Réaction : Curieux / Refus poli / Refus sec / Pas dispo, rappel jeudi
- Notes : "Utilise déjà Pioneer pour le suivi", "Ouvert à une démo si gratuit", etc.
- Next action : Démo bookée le X / Rappel le Y / Fin du contact
```

## Téléphone source

Pour récupérer le téléphone d'un dirigeant identifié :

1. **Pappers** : champ `telephone_siege` (parfois disponible)
2. **Pages Jaunes API** : `https://www.pagesjaunes.fr/recherche/{ville}/{raison_sociale}` — scrape doux du standard téléphonique
3. **Site web société** : page contact / mentions légales (souvent listé)
4. **Score** Apollo / Hunter — peuvent avoir des numéros pro

**Ne JAMAIS** appeler un numéro perso de dirigeant (data Pappers `telephone_dirigeant` n'existe pas RGPD).

## Cadence agent — assistance Ousmane

Quand Ousmane prépare ses appels du matin (vers 9h30) :

```
USER: Prépare-moi mes 5 appels d'aujourd'hui

AGENT: 5 prospects scorés >= 7 dans wiki/leads-DSPilot.md, dispos pour appel :
1. M. Dupont (TRANSPORT BERTRAND, 75) — Variant 2 (senior 58 ans)
   Tel : 01 43 XX XX XX (Pages Jaunes)
   Notes : siège à 2km de DIF1, BODACC mentionne Amazon Logistics
   Hook : "On est voisins de station, j'aimerais te montrer ce que j'ai construit"
2. ...

[bot prépare un canvas avec les 5 scripts personnalisés]
```
