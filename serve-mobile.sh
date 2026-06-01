#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8012}"
HOST="$(ipconfig getifaddr en0 || true)"

if [ -z "$HOST" ]; then
  HOST="$(ipconfig getifaddr en1 || true)"
fi

echo "电脑打开: http://127.0.0.1:${PORT}"
if [ -n "$HOST" ]; then
  echo "手机/iPad 同一 Wi-Fi 打开: http://${HOST}:${PORT}"
else
  echo "没有自动找到局域网 IP；请在系统网络设置里查看本机 IP。"
fi

python3 -m http.server "$PORT" --bind 0.0.0.0
