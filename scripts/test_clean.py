#!/usr/bin/env python3
"""Vérifie le nettoyage des sous-titres (aucun réseau requis).

    python3 scripts/test_clean.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_transcripts import clean_subtitles, slugify  # noqa: E402

# Extrait réaliste d'une piste auto-générée YouTube : en-tête, réglages de
# position, balises <c> et <00:00:00.000>, et surtout la répétition due au
# défilement des sous-titres.
AUTO_VTT = """WEBVTT
Kind: captions
Language: en

00:00:00.120 --> 00:00:02.560 align:start position:0%
the<00:00:00.480><c> biggest</c><00:00:00.800><c> mistake</c><00:00:01.200><c> I</c><00:00:01.500><c> see</c>

00:00:02.560 --> 00:00:02.570 align:start position:0%
the biggest mistake I see

00:00:02.570 --> 00:00:05.000 align:start position:0%
the biggest mistake I see
entrepreneurs<00:00:03.100><c> make</c><00:00:03.600><c> is</c><00:00:04.000><c> this</c>

00:00:05.000 --> 00:00:05.010 align:start position:0%
entrepreneurs make is this

00:00:05.010 --> 00:00:07.400 align:start position:0%
entrepreneurs make is this
they&#39;re<00:00:05.500><c> scared</c><00:00:06.000><c> of</c><00:00:06.400><c> volume</c>

00:00:12.000 --> 00:00:14.500 align:start position:0%
so&nbsp;here&#39;s what you do &amp; why

00:00:14.500 --> 00:00:16.000 align:start position:0%
<i>you do more</i>
"""

# Piste manuelle au format SRT, avec numéros de cue.
MANUAL_SRT = """1
00:00:01,000 --> 00:00:03,000
Welcome back to the channel.

2
00:00:03,000 --> 00:00:06,000
Today we're talking about offers.
"""

VTT_WITH_NOTES = """WEBVTT

NOTE
Ceci est un commentaire
qui tient sur deux lignes.

STYLE
::cue { color: white }

00:00:01.000 --> 00:00:02.000
Contenu réel.
"""


def check(name, got, expected):
    if got == expected:
        print(f"  ✓ {name}")
        return True
    print(f"  ✗ {name}\n    attendu : {expected!r}\n    obtenu  : {got!r}")
    return False


def main():
    ok = True
    print("Sous-titres auto-générés (VTT) :")
    out = clean_subtitles(AUTO_VTT)
    ok &= check("aucun timestamp", "-->" not in out and "00:00" not in out, True)
    ok &= check("aucune balise", "<" not in out and ">" not in out, True)
    ok &= check("entités HTML décodées", "they're scared of volume" in out, True)
    ok &= check("&amp; décodé", "what you do & why" in out, True)
    ok &= check("&nbsp; normalisé", "so here's what you do" in out, True)
    ok &= check("balises <i> retirées", "you do more" in out, True)
    ok &= check(
        "pas de répétition du défilement",
        out.count("the biggest mistake I see"), 1,
    )
    ok &= check(
        "pas de répétition (2e ligne)",
        out.count("entrepreneurs make is this"), 1,
    )
    ok &= check(
        "silence > 3s = nouveau paragraphe",
        out.count("\n\n"), 1,
    )

    print("\nSous-titres manuels (SRT) :")
    out_srt = clean_subtitles(MANUAL_SRT)
    ok &= check(
        "numéros de cue retirés",
        out_srt.strip(),
        "Welcome back to the channel. Today we're talking about offers.",
    )

    print("\nBlocs NOTE / STYLE :")
    out_notes = clean_subtitles(VTT_WITH_NOTES)
    ok &= check("blocs ignorés", out_notes.strip(), "Contenu réel.")

    print("\nNoms de fichiers :")
    ok &= check(
        "slug propre",
        slugify("How to Get 100 Clients! (Ep. 42) — Été"),
        "how-to-get-100-clients-ep-42-ete",
    )
    ok &= check("titre vide", slugify(""), "sans-titre")

    print("\nRésultat du nettoyage :\n" + "-" * 46)
    print(out + "-" * 46)
    print("\nTOUS LES TESTS PASSENT" if ok else "\nDES TESTS ÉCHOUENT")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
