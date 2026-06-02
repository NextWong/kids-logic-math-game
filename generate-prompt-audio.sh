#!/usr/bin/env bash
set -euo pipefail

VOICE="${1:-Flo (中文（中国大陆）)}"
OUT_DIR="audio/prompts"
TMP_DIR="$(mktemp -d)"

trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$OUT_DIR"

make_audio() {
  local key="$1"
  local text="$2"
  local aiff="$TMP_DIR/$key.aiff"
  local mp3="$OUT_DIR/$key.mp3"
  local bytes

  say -v "$VOICE" -o "$aiff" "$text"
  bytes="$(afinfo "$aiff" | awk '/audio bytes/ {print $3}')"
  if [[ -z "$bytes" || "$bytes" -le 0 ]]; then
    echo "Generated empty audio for $key with voice: $VOICE" >&2
    exit 1
  fi

  ffmpeg -y -loglevel error -i "$aiff" -codec:a libmp3lame -q:a 5 "$mp3"
}

ITEMS=(
  "flower|小花"
  "berry|果子"
  "carrot|胡萝卜"
  "fish|小鱼"
  "balloon|气球"
  "star-treat|星星糖"
)

for item in "${ITEMS[@]}"; do
  IFS="|" read -r id label <<< "$item"

  for count in {1..6}; do
    make_audio "count-$id-$count" "花园里有几颗${label}？"
  done

  for left in {1..3}; do
    max_right=$((6 - left))
    for ((right = 1; right <= max_right; right += 1)); do
      make_audio "add-$id-$left-$right" "${left} 加 ${right}，一共有几颗${label}？"
    done
  done
done

make_audio "pattern-next-shape" "接下来应该是哪一个图形？"

echo "Generated prompt audio with voice: $VOICE"
