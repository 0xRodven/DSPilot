# Handoff — Computer Use Agent : Analyse scraping Amazon Logistics

## Mission

Tu es un agent Computer Use sur le Mac de l'utilisateur. L'utilisateur est **déjà connecté** sur Amazon Logistics (`https://logistics.amazon.fr/dspconsole`).

Ta mission est **uniquement d'analyser et documenter** — pas de télécharger, pas de modifier quoi que ce soit. Produis un rapport précis que l'utilisateur remettra à un autre agent pour améliorer le pipeline de scraping automatisé sur un VPS.

---

## Contexte métier

L'utilisateur gère une DSP (Delivery Service Partner) Amazon en France. Il a un SaaS (DSPilot) qui ingère les rapports de performance hebdomadaires de ses livreurs.

### Rapports critiques à scraper chaque semaine

| Rapport | Contenu | Fréquence |
|---------|---------|-----------|
| **DWC-IADC Report** | Stats DWC/IADC par livreur (compliance livraison) | Hebdo |
| **Daily Report** | RTS / DNR / POD Fails / CC Fails par livreur par jour | Hebdo |
| **DNR Investigations** | Liste des colis non reçus | Hebdo |
| **Supplementary Reports** | Vue agrégée semaine | Hebdo |

Ces rapports sont accessibles via **"Rapports supplémentaires"** dans la console Amazon Logistics.

---

## Ce que fait le scraper actuel (sur VPS)

Le scraper actuel (`amazon_supplementary_sync.py`) :
1. Navigue vers `https://logistics.amazon.fr/dspconsole` (section "Rapports supplémentaires")
2. Capture le HTML de la page principale
3. Télécharge les rapports listés (liens HTML)
4. Clique le bouton "semaine précédente" pour remonter dans le temps
5. Répète N fois (paramètre `--weeks`)

**Problèmes connus :**
- Injection de cookies fragile (expire, sameSite, CDP)
- Incertitude sur combien de semaines Amazon garde accessible
- Le sélecteur du bouton "semaine précédente" est `button.css-px7qg4` — peut changer
- On ne sait pas si Amazon affiche les mêmes rapports pour toutes les semaines passées

---

## Ta mission : analyse en 5 points

### Point 1 — Navigation et structure de l'URL

- Ouvre `https://logistics.amazon.fr/dspconsole`
- Note l'URL exacte une fois la page chargée (y a-t-il des paramètres semaine dans l'URL ?)
- Va dans la section "Rapports supplémentaires" (ou équivalent)
- Note l'URL exacte de cette section
- **Question clé** : est-ce que l'URL change quand on change de semaine ? Si oui, quel est le pattern ? (ex: `?week=14&year=2026`)

### Point 2 — Sélecteur du week picker

- Identifie visuellement le sélecteur de semaine (probablement en haut à droite ou en haut à gauche)
- Fais un clic droit → "Inspecter" sur le bouton "semaine précédente"
- Note :
  - Le sélecteur CSS exact (`button.css-px7qg4` ou autre ?)
  - Le `data-testid` s'il existe
  - Le `aria-label` s'il existe
  - Le texte affiché sur le bouton
- Fais de même pour le bouton "semaine suivante"
- Inspecte le conteneur qui affiche "Semaine X / 2026" — note son sélecteur et le format exact du texte

### Point 3 — Disponibilité des semaines passées

- Clique "semaine précédente" plusieurs fois en notant à chaque clic :
  - Semaine affichée (ex: "W13 / 2026")
  - Le bouton "précédent" est-il toujours cliquable ?
  - Les rapports sont-ils toujours listés ?
- Continue jusqu'à ce que le bouton soit grisé/désactivé OU que la liste de rapports soit vide
- **Note la semaine la plus ancienne accessible**

### Point 4 — Structure des rapports listés

Sur la semaine courante (W14 / 2026) :
- Liste **tous** les rapports affichés avec :
  - Nom exact du rapport tel qu'affiché dans l'UI
  - Type de lien (href direct ? bouton qui déclenche un download ? bouton qui ouvre un modal ?)
  - Format du fichier (`.html`, `.csv`, `.pdf`, `.xlsx` ?)
  - Si c'est un href : note l'URL complète ou le pattern
  - Si c'est un bouton : note le `data-testid`, `aria-label`, ou sélecteur CSS
- Y a-t-il des rapports qui apparaissent certaines semaines et pas d'autres ?

### Point 5 — Session et authentification

- Note si tu vois un token ou session ID dans les cookies (ouvre DevTools → Application → Cookies → `logistics.amazon.fr`)
- Note les noms des cookies présents (pas les valeurs — juste les noms et leur durée d'expiration approximative)
- La page fait-elle des requêtes XHR/fetch pour charger les données ? (DevTools → Network → Filter XHR) — si oui, note les endpoints

---

## Format du rapport à produire

```markdown
# Analyse Amazon Logistics — Scraping

## 1. URLs et navigation
- URL section rapports : ...
- URL change avec semaine : oui/non
- Pattern URL si oui : ...

## 2. Sélecteurs week picker
- Bouton précédent : ...
- Bouton suivant : ...
- Display semaine courante : ...
- Format texte semaine : ...

## 3. Historique disponible
- Semaine courante : W14 / 2026
- Semaine la plus ancienne accessible : ...
- Nombre de semaines disponibles : ...
- Comportement bouton sur limite : ...

## 4. Rapports disponibles (W14 / 2026)
| Nom affiché | Type lien | Format fichier | Sélecteur/URL |
|-------------|-----------|----------------|---------------|
| ...

## 5. Auth / Session
- Cookies présents : ...
- Durée expiration principale session : ...
- XHR endpoints détectés : ...

## 6. Observations complémentaires
(tout ce qui te semble utile pour automatiser)
```

---

## Contraintes importantes

- **NE PAS télécharger** de fichiers
- **NE PAS modifier** de données
- **NE PAS naviguer** hors de la section rapports
- Si une popup de consentement ou un modal apparaît, note-le et ferme-le
- Si tu es redirigé vers une page de login, STOP — note-le dans le rapport

---

## Livrables

Un seul fichier Markdown avec le rapport complet selon le format ci-dessus. L'utilisateur le remettra à l'agent VPS pour améliorer le scraper `amazon_supplementary_sync.py`.
