#!/usr/bin/env bash
set -euo pipefail

host="127.0.0.1"
port="4173"
url="http://${host}:${port}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

server_pid=""

cleanup() {
	if [ -n "$server_pid" ] && kill -0 "$server_pid" 2>/dev/null; then
		kill "$server_pid" 2>/dev/null || true
		wait "$server_pid" 2>/dev/null || true
	fi
}

stop_stale_server() {
	if ! command -v lsof >/dev/null 2>&1; then
		return
	fi

	local pids
	pids="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"

	if [ -z "$pids" ]; then
		return
	fi

	local pid command_line
	for pid in $pids; do
		command_line="$(ps -p "$pid" -o command= 2>/dev/null || true)"
		case "$command_line" in
			*"python"*"-m http.server"*" $port"*|*"Python"*"-m http.server"*" $port"*)
				echo "Stopping previous dev server on ${url} (pid ${pid})."
				kill "$pid" 2>/dev/null || true
				;;
			*)
				echo "Port ${port} is already in use by pid ${pid}:"
				echo "$command_line"
				echo "Stop that process or change the dev server port."
				exit 1
				;;
		esac
	done
}

wait_for_server() {
	local attempts=0
	while [ "$attempts" -lt 50 ]; do
		if curl -fsS "$url" >/dev/null 2>&1; then
			return
		fi

		if ! kill -0 "$server_pid" 2>/dev/null; then
			wait "$server_pid"
			exit $?
		fi

		attempts=$((attempts + 1))
		sleep 0.1
	done

	echo "Timed out waiting for ${url}."
	exit 1
}

cd "$repo_root"

npm run build
stop_stale_server

python3 -m http.server "$port" --bind "$host" &
server_pid="$!"
trap cleanup EXIT INT TERM HUP

wait_for_server

if [ "${SKIP_OPEN:-}" != "1" ]; then
	open -a Safari "$url"
fi

echo "Serving ${url}. Stop this debug session to shut down the server."
wait "$server_pid"
