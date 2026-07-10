#!/usr/bin/env bash
# optimize-images.sh — resize full-res photos into web-optimized WebP for the site.
#
# Masters stay in Google Drive. This script produces the small deploy-ready
# derivatives that get committed to the repo.
#
# Usage:
#   ./optimize-images.sh <src_dir> <out_dir> [max_width] [quality]
#
# Examples:
#   ./optimize-images.sh "~/Drive/.../Holly House on Metolius" landing-pages/live-wedding-painting/img 1800 80
#   ./optimize-images.sh ./picks ./out 2000 82
#
# Requires: cwebp (brew install webp), sips (built-in on macOS for HEIC handling).

set -euo pipefail

SRC="${1:?usage: optimize-images.sh <src_dir> <out_dir> [max_width] [quality]}"
OUT="${2:?usage: optimize-images.sh <src_dir> <out_dir> [max_width] [quality]}"
MAXW="${3:-1800}"     # max width in px; height auto-scales to preserve aspect
Q="${4:-80}"          # WebP quality 0-100

command -v cwebp >/dev/null 2>&1 || { echo "ERROR: cwebp not found (brew install webp)"; exit 1; }
mkdir -p "$OUT"

echo "Optimizing images"
echo "  src:     $SRC"
echo "  out:     $OUT"
echo "  max w:   ${MAXW}px   quality: ${Q}"
echo "-----------------------------------------------------------"

shopt -s nullglob nocaseglob
count=0
for f in "$SRC"/*.{jpg,jpeg,png,heic,tif,tiff}; do
  [ -e "$f" ] || continue
  base="$(basename "$f")"
  name="${base%.*}"
  # kebab-case the output name, drop noise so URLs stay clean
  slug="$(echo "$name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')"
  outfile="$OUT/${slug}.webp"

  src="$f"
  tmp=""
  # cwebp can't read HEIC; transcode to a temp PNG via sips first
  case "${base##*.}" in
    [Hh][Ee][Ii][Cc])
      tmp="$(mktemp -t optimg).png"
      sips -s format png "$f" --out "$tmp" >/dev/null
      src="$tmp"
      ;;
  esac

  cwebp -quiet -q "$Q" -resize "$MAXW" 0 -m 6 -metadata none "$src" -o "$outfile"
  [ -n "$tmp" ] && rm -f "$tmp"

  in_kb=$(( $(stat -f%z "$f") / 1024 ))
  out_kb=$(( $(stat -f%z "$outfile") / 1024 ))
  printf "  %-42s %5dKB -> %4dKB   %s\n" "$slug.webp" "$in_kb" "$out_kb" "$(basename "$f")"
  count=$((count+1))
done

echo "-----------------------------------------------------------"
echo "Done. $count image(s) -> $OUT"
echo "Note: cwebp -resize only shrinks the width; verify no upscaling if a source is smaller than ${MAXW}px."
