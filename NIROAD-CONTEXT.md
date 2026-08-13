# NIROAD — Contexte business

> Fichier de contexte lu par Claude Code (importé depuis `CLAUDE.md`).
> Les skills Hormozi lisent ce contexte et arrêtent de sortir des conseils génériques.

---

## L'entreprise

**NIROAD** — agence d'automatisation IA.
Site : niroadia.fr
Fondateur : Nicolas Rodriguez, Carbon Blanc (33). Actuellement VRP en vente directe chez SARL POWER COM (Ohm Énergie) en parallèle.
Accompagnement payant en cours (formateur : Hamza).

## La niche — DÉCIDÉE, ne pas rediscuter

**Cabinets de recrutement**, ciblage : 2 à 10 personnes, avec du flux.
Code NAF 78.10Z. Extension future possible vers l'intérim indépendant.

Niches déjà testées et abandonnées (ne pas les reproposer) :

- Agences de marketing digital → budget insuffisant + font déjà l'IA en interne
- Coachs sportifs en ligne → K.O. selon le formateur (pas de budget, ou injouables)
- Sociétés de nettoyage, complexes padel/five, agences de voyage, courtiers en énergie → écartées

## L'offre — EN CONSTRUCTION

Angle retenu : **le sourcing / la recherche de candidats.**
Angle abandonné sur consigne du coach : l'administratif (facturation, relances) — les cabinets ne paieront pas ~2 000 € pour ça.
Brique technique de référence : système de recrutement IA no-code (tri et qualification de candidats via n8n).
Prix cible évoqué : ~2 000 €.

**À produire :** offre packagée (core + bonus + garantie), nom d'offre, justification du prix.

## Données terrain (appels de découverte, juillet 2026)

12 appels passés, 4 conversations exploitables.

| Cabinet | Interlocuteur | Ce qui est ressorti |
|---|---|---|
| MAHE | Hélène | ATS = Jarvis. Douleur n°1 = **recherche de candidats** (LinkedIn + chasse). Admin = 20-30 % du temps, exploserait en premier si les clients doublaient |
| Alphéa Conseil Bordeaux | Associée | ERP propriétaire (CRM + ATS fusionnés) avec IA intégrée. Confirme l'admin à 20-30 % |
| Altaide | Laure | Pas de tâche dominante. Sourcing via LinkedIn « Optimum ». Relances candidats fantômes via LinkedIn. « Ça va pas nous intéresser » dès la mention IA |
| Adeis RH Nantes | Standardiste | Barrage. Vendredi 18h15 |

**Enseignement clé :** aucun cabinet appelé n'a dit utiliser l'IA — contrairement à l'appréhension de départ.

**Objection récurrente à traiter :** « LinkedIn fait déjà ça » / rejet réflexe à la mention de l'IA.

## Consignes du coach — non négociables

1. Ne contacter **QUE les décideurs**, jamais les standards
2. Pas d'angle administratif
3. Pas de cabinets de 1-2 personnes — uniquement 3-10

## État de la prospection

- **88 cabinets validés** (API Recherche d'Entreprises data.gouv.fr : NAF 78.10Z, effectif 3-9, actifs) avec nom du dirigeant
- 18 fiches à vérifier (agences de mannequins mélangées dans les résultats)
- **13 mobiles récupérés** — enrichissement Apollo à la main, taux de match 62,5 % sur la cible
- Objectif de volume envisagé : jusqu'à 200 appels/jour

**Goulot d'étranglement actuel : l'enrichissement des numéros directs et le volume d'appels réels.** Pas la théorie.

## Contraintes outils

- Apollo : plan gratuit sans accès API → enrichissement manuel dans l'app. Basic à 65 $/mois = 2 500 crédits, 8 crédits par mobile révélé
- Pappers : API sans crédit (offre gratuite supprimée)
- Lusha : inscription bloquée
- Vente en visio, clients en ligne — pas de local

---

## Comment utiliser les skills Hormozi avec ce contexte

Router à coller en début de session :

```
Tu es mon stratège GTM. Lis NIROAD-CONTEXT.md avant toute réponse.
Choisis 1 à 3 skills Hormozi applicables et exécute-les dans l'ordre.
- hormozi-sales → structure d'appel CLOSER, objections
- hormozi-offers → équation Grand Slam Offer, pricing, garantie
- hormozi-gtm-acquisition → Core Four, scripts d'outreach, benchmarks
Contraintes NIROAD : niche figée (cabinets de recrutement 3-10),
angle sourcing uniquement, décideurs uniquement.
Ne me propose jamais de changer de niche.
Cite la skill utilisée et crédite Alex Hormozi.
```

Ordre de travail recommandé :

1. `hormozi-offers` → finaliser l'offre sourcing et son prix
2. `hormozi-sales` → script d'appel + réponses aux 2 objections identifiées
3. Appeler. 88 cabinets en attente.
4. `hormozi-gtm-acquisition` seulement une fois la liste épuisée

---

*Frameworks : Alex Hormozi (@AlexHormozi sur YouTube). Repo tiers non affilié.*
