#!/usr/bin/env python3
"""Télécharge les transcriptions (sous-titres) d'une chaîne YouTube.

Un fichier .txt propre par vidéo : pas de timestamps, pas de balises,
pas de doublons. Les vidéos elles-mêmes ne sont jamais téléchargées.

Usage :
    python3 scripts/fetch_transcripts.py
    python3 scripts/fetch_transcripts.py --channel @AlexHormozi --out corpus-hormozi
    python3 scripts/fetch_transcripts.py --include-shorts --include-lives
    python3 scripts/fetch_transcripts.py --limit 5          # test rapide
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

# ---------------------------------------------------------------------------
# Nettoyage VTT/SRT
# ---------------------------------------------------------------------------

# 00:00:12.345 --> 00:00:15.678 align:start position:0%
TIMING_RE = re.compile(
    r"^\s*(?P<start>(?:\d+:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*"
    r"(?P<end>(?:\d+:)?\d{2}:\d{2}[.,]\d{3})"
)
# <c>, </c>, <00:00:01.500>, <i>, <b>, <v Speaker> ...
TAG_RE = re.compile(r"</?[^>]+>")
# Identifiant de cue SRT (une ligne qui ne contient qu'un nombre)
CUE_ID_RE = re.compile(r"^\d+$")
# En-têtes et blocs de métadonnées WebVTT
HEADER_RE = re.compile(r"^(WEBVTT|Kind:|Language:|X-TIMESTAMP-MAP)", re.IGNORECASE)
BLOCK_KEYWORD_RE = re.compile(r"^(NOTE|STYLE|REGION)\b")
# Espaces multiples
WS_RE = re.compile(r"[ \t ]+")

# Pause (en secondes) au-delà de laquelle on commence un nouveau paragraphe.
PARAGRAPH_GAP = 3.0
# Nombre de lignes récentes comparées pour éliminer les répétitions du
# défilement des sous-titres automatiques.
DEDUPE_WINDOW = 6


def _parse_ts(value: str) -> float:
    """Convertit '00:01:02.345' (ou '01:02.345') en secondes."""
    value = value.replace(",", ".")
    parts = value.split(":")
    seconds = float(parts[-1])
    if len(parts) >= 2:
        seconds += int(parts[-2]) * 60
    if len(parts) >= 3:
        seconds += int(parts[-3]) * 3600
    return seconds


def _normalize(line: str) -> str:
    """Retire les balises, décode les entités HTML, normalise les espaces."""
    line = TAG_RE.sub("", line)
    line = html.unescape(line)
    line = line.replace("​", "").replace(" ", " ")
    return WS_RE.sub(" ", line).strip()


def clean_subtitles(raw: str) -> str:
    """Transforme un contenu VTT/SRT en texte courant propre.

    Retire les timestamps, les balises et les répétitions produites par le
    défilement des sous-titres auto-générés, puis regroupe le texte en
    paragraphes en s'appuyant sur les silences.
    """
    paragraphs: list[list[str]] = [[]]
    recent: list[str] = []          # fenêtre glissante anti-doublons
    prev_end: float | None = None
    cue_start: float | None = None
    cue_end: float | None = None
    in_cue = False
    skip_block = False

    for raw_line in raw.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            in_cue = False
            skip_block = False
            continue
        if skip_block:
            continue
        if HEADER_RE.match(stripped):
            continue
        if BLOCK_KEYWORD_RE.match(stripped):
            skip_block = True         # ignore le bloc NOTE/STYLE/REGION entier
            continue

        timing = TIMING_RE.match(stripped)
        if timing:
            cue_start = _parse_ts(timing.group("start"))
            cue_end = _parse_ts(timing.group("end"))
            in_cue = True
            continue
        if CUE_ID_RE.match(stripped) and not in_cue:
            continue                  # numéro de cue SRT

        text = _normalize(stripped)
        if not text:
            continue
        if text in recent:            # répétition du défilement : on ignore
            continue

        # Nouveau paragraphe après un silence notable.
        if (
            prev_end is not None
            and cue_start is not None
            and cue_start - prev_end >= PARAGRAPH_GAP
            and paragraphs[-1]
        ):
            paragraphs.append([])

        paragraphs[-1].append(text)
        recent.append(text)
        if len(recent) > DEDUPE_WINDOW:
            recent.pop(0)
        if cue_end is not None:
            prev_end = cue_end

    chunks = [" ".join(p).strip() for p in paragraphs]
    body = "\n\n".join(c for c in chunks if c)
    return body + "\n" if body else ""


# ---------------------------------------------------------------------------
# yt-dlp
# ---------------------------------------------------------------------------


def ytdlp_cmd() -> list[str]:
    """Retourne la commande yt-dlp disponible, ou termine avec un message."""
    if shutil.which("yt-dlp"):
        return ["yt-dlp"]
    probe = subprocess.run(
        [sys.executable, "-m", "yt_dlp", "--version"],
        capture_output=True,
        text=True,
    )
    if probe.returncode == 0:
        return [sys.executable, "-m", "yt_dlp"]
    sys.exit(
        "yt-dlp introuvable. Installe-le avec :\n"
        f"    {sys.executable} -m pip install --upgrade yt-dlp"
    )


def slugify(text: str, limit: int = 80) -> str:
    """Nom de fichier sûr, lisible, sans accents ni caractères spéciaux."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip()
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:limit].strip("-").lower() or "sans-titre"


@dataclass
class Video:
    video_id: str
    title: str
    upload_date: str = ""

    @property
    def url(self) -> str:
        return f"https://www.youtube.com/watch?v={self.video_id}"

    def stem(self) -> str:
        date = self.upload_date or "00000000"
        return f"{date}_{slugify(self.title)}_{self.video_id}"


@dataclass
class Stats:
    written: int = 0
    skipped_existing: int = 0
    no_subs: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def list_videos(base: list[str], channel: str, tabs: list[str], args) -> list[Video]:
    """Énumère les vidéos de la chaîne sans rien télécharger."""
    videos: list[Video] = []
    seen: set[str] = set()

    for tab in tabs:
        url = f"https://www.youtube.com/{channel}/{tab}"
        print(f"→ Énumération de {url}", flush=True)
        cmd = base + [
            "--flat-playlist",
            "--ignore-errors",
            "--no-warnings",
            "--print", "%(id)s\t%(title)s\t%(upload_date)s",
        ]
        cmd += extra_ytdlp_args(args)
        cmd.append(url)

        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0 and not proc.stdout.strip():
            print(f"  ! onglet '{tab}' indisponible : "
                  f"{proc.stderr.strip().splitlines()[-1] if proc.stderr.strip() else 'erreur inconnue'}",
                  file=sys.stderr)
            continue

        count = 0
        for line in proc.stdout.splitlines():
            parts = line.split("\t")
            if len(parts) < 2 or not parts[0].strip():
                continue
            vid = parts[0].strip()
            if vid in seen or vid.upper() == "NA":
                continue
            seen.add(vid)
            date = parts[2].strip() if len(parts) > 2 else ""
            videos.append(
                Video(vid, parts[1].strip() or vid, "" if date == "NA" else date)
            )
            count += 1
        print(f"  {count} vidéo(s) trouvée(s)", flush=True)

    return videos


def extra_ytdlp_args(args) -> list[str]:
    """Options communes passées à chaque appel yt-dlp."""
    extra: list[str] = []
    if args.cookies_from_browser:
        extra += ["--cookies-from-browser", args.cookies_from_browser]
    if args.cookies:
        extra += ["--cookies", args.cookies]
    if args.sleep:
        extra += ["--sleep-requests", str(args.sleep)]
    return extra


def fetch_one(base: list[str], video: Video, out_dir: Path, tmp_dir: Path,
              args, stats: Stats) -> bool:
    """Récupère et nettoie les sous-titres d'une vidéo. True si un fichier est écrit."""
    target = out_dir / f"{video.stem()}.txt"
    if target.exists() and not args.force:
        stats.skipped_existing += 1
        return False

    for f in tmp_dir.glob("*"):
        f.unlink()

    cmd = base + [
        "--skip-download",          # jamais la vidéo elle-même
        "--write-subs",             # sous-titres manuels si présents
        "--write-auto-subs",        # sinon transcription automatique
        "--sub-langs", args.langs,
        "--sub-format", "vtt/srt/best",
        "--no-warnings",
        "--ignore-errors",
        "--retries", "5",
        "--fragment-retries", "5",
        "-o", str(tmp_dir / "%(id)s.%(ext)s"),
    ]
    cmd += extra_ytdlp_args(args)
    cmd.append(video.url)

    proc = subprocess.run(cmd, capture_output=True, text=True)

    files = sorted(tmp_dir.glob("*.vtt")) + sorted(tmp_dir.glob("*.srt"))
    if not files:
        if proc.returncode != 0:
            tail = proc.stderr.strip().splitlines()
            stats.errors.append(f"{video.video_id} — {tail[-1] if tail else 'échec yt-dlp'}")
        else:
            stats.no_subs.append(video.video_id)
        return False

    # Préfère une piste manuelle (sans '.auto') si plusieurs sont présentes.
    files.sort(key=lambda p: ("auto" in p.name.lower(), len(p.name)))
    text = clean_subtitles(files[0].read_text(encoding="utf-8", errors="replace"))
    if not text.strip():
        stats.no_subs.append(video.video_id)
        return False

    target.write_text(text, encoding="utf-8")
    stats.written += 1
    return True


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Télécharge les transcriptions d'une chaîne YouTube (sans les vidéos)."
    )
    parser.add_argument("--channel", default="@AlexHormozi",
                        help="Handle de la chaîne (défaut : @AlexHormozi)")
    parser.add_argument("--out", default="corpus-hormozi",
                        help="Dossier de sortie (défaut : corpus-hormozi)")
    parser.add_argument("--langs", default="en.*,en",
                        help="Langues des sous-titres (défaut : en.*,en)")
    parser.add_argument("--include-shorts", action="store_true",
                        help="Inclure aussi les Shorts")
    parser.add_argument("--include-lives", action="store_true",
                        help="Inclure aussi les lives / rediffusions")
    parser.add_argument("--limit", type=int, default=0,
                        help="S'arrêter après N vidéos (test)")
    parser.add_argument("--sleep", type=float, default=1.0,
                        help="Pause entre requêtes, en secondes (défaut : 1)")
    parser.add_argument("--force", action="store_true",
                        help="Re-télécharger même si le fichier existe déjà")
    parser.add_argument("--cookies-from-browser", default="",
                        help="Ex. chrome/firefox — utile si YouTube demande une vérification")
    parser.add_argument("--cookies", default="",
                        help="Chemin vers un fichier cookies.txt")
    args = parser.parse_args()

    base = ytdlp_cmd()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir = out_dir / ".tmp"
    tmp_dir.mkdir(exist_ok=True)

    tabs = ["videos"]
    if args.include_shorts:
        tabs.append("shorts")
    if args.include_lives:
        tabs.append("streams")

    videos = list_videos(base, args.channel, tabs, args)
    if not videos:
        print("Aucune vidéo trouvée — chaîne injoignable ou handle incorrect.",
              file=sys.stderr)
        return 1
    if args.limit:
        videos = videos[: args.limit]

    print(f"\n{len(videos)} vidéo(s) à traiter.\n", flush=True)

    stats = Stats()
    manifest = []
    for i, video in enumerate(videos, 1):
        print(f"[{i}/{len(videos)}] {video.title[:70]}", flush=True)
        try:
            ok = fetch_one(base, video, out_dir, tmp_dir, args, stats)
        except KeyboardInterrupt:
            print("\nInterrompu. Relance la commande pour reprendre.", file=sys.stderr)
            break
        except Exception as exc:                      # noqa: BLE001
            stats.errors.append(f"{video.video_id} — {exc}")
            continue
        if ok:
            manifest.append({
                "id": video.video_id,
                "title": video.title,
                "upload_date": video.upload_date,
                "url": video.url,
                "file": f"{video.stem()}.txt",
            })

    shutil.rmtree(tmp_dir, ignore_errors=True)

    if manifest:
        manifest_path = out_dir / "_manifest.json"
        existing = []
        if manifest_path.exists():
            try:
                existing = json.loads(manifest_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                existing = []
        by_id = {entry["id"]: entry for entry in existing}
        by_id.update({entry["id"]: entry for entry in manifest})
        manifest_path.write_text(
            json.dumps(sorted(by_id.values(), key=lambda e: e["upload_date"]),
                       ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    total = len(list(out_dir.glob("*.txt")))
    print("\n" + "=" * 52)
    print(f"Transcriptions écrites cette fois : {stats.written}")
    if stats.skipped_existing:
        print(f"Déjà présentes (ignorées)        : {stats.skipped_existing}")
    if stats.no_subs:
        print(f"Sans sous-titres disponibles     : {len(stats.no_subs)}")
    if stats.errors:
        print(f"Erreurs                          : {len(stats.errors)}")
        for err in stats.errors[:10]:
            print(f"  - {err}")
        if len(stats.errors) > 10:
            print(f"  … et {len(stats.errors) - 10} autre(s)")
    print(f"TOTAL dans {out_dir}/ : {total} fichiers .txt")
    print("=" * 52)
    return 0


if __name__ == "__main__":
    sys.exit(main())
