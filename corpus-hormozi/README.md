# corpus-hormozi

Transcriptions des vidéos de la chaîne YouTube [@AlexHormozi](https://www.youtube.com/@AlexHormozi).

Ce dossier est **vide dans le dépôt** : les transcriptions sont des données
générées (et du contenu tiers), elles ne sont pas versionnées. Lance le script
pour le remplir.

## Remplir le corpus

```bash
python3 -m pip install --upgrade yt-dlp
python3 scripts/fetch_transcripts.py
```

Le script affiche le nombre de transcriptions récupérées à la fin.

## Contenu produit

- `AAAAMMJJ_titre_videoID.txt` — un fichier par vidéo, texte courant propre :
  pas de timestamps, pas de balises, pas de répétitions, paragraphes séparés
  au niveau des silences.
- `_manifest.json` — métadonnées (id, titre, date, URL, fichier).

## Options utiles

| Option | Effet |
| --- | --- |
| `--include-shorts` | Ajoute les Shorts (exclus par défaut) |
| `--include-lives` | Ajoute les lives et rediffusions |
| `--limit 5` | S'arrête après 5 vidéos (test rapide) |
| `--langs "fr,en.*"` | Change les langues des sous-titres |
| `--force` | Re-télécharge les fichiers déjà présents |
| `--cookies-from-browser chrome` | Si YouTube demande une vérification anti-bot |

Le script est **reprenable** : il ignore les vidéos déjà transcrites, donc on
peut l'interrompre et le relancer sans perdre le travail déjà fait.

Les vidéos elles-mêmes ne sont jamais téléchargées (`--skip-download`), seules
les pistes de sous-titres le sont.

## Vérifier le nettoyage

```bash
python3 scripts/test_clean.py   # ne nécessite aucun accès réseau
```

## Note sur l'accès réseau

Ce script a besoin d'un accès sortant à `youtube.com`. Dans un environnement
dont la politique réseau bloque l'egress (proxy renvoyant `403` sur le
CONNECT), l'énumération échoue immédiatement avec « Aucune vidéo trouvée » :
c'est un blocage réseau, pas une erreur du script.
