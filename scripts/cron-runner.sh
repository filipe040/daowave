#!/usr/bin/env bash
# =============================================================================
# LivePass — executor de jobs cron (VPS / PM2, sem Vercel)
#
# Uso manual:
#   export CRON_SECRET="..."
#   export APP_BASE_URL="http://127.0.0.1:3000"   # ou https://livepass.pt
#   ./scripts/cron-runner.sh release-holds
#   ./scripts/cron-runner.sh all
#
# Crontab: ver infra/crontab.example
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Carregar .env de produção se existir (VPS)
for envfile in \
  "$REPO_ROOT/apps/web/.env" \
  "$REPO_ROOT/apps/web/.env.production" \
  "$REPO_ROOT/.env"; do
  if [[ -f "$envfile" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$envfile"
    set +a
    break
  fi
done

CRON_SECRET="${CRON_SECRET:-}"
APP_BASE_URL="${APP_BASE_URL:-${NEXTAUTH_URL:-${APP_URL:-http://127.0.0.1:3000}}}"
APP_BASE_URL="${APP_BASE_URL%/}"

if [[ -z "$CRON_SECRET" ]]; then
  echo "ERRO: CRON_SECRET não definido. Adiciona ao .env ou exporta antes de correr." >&2
  exit 1
fi

AUTH_HEADER="Authorization: Bearer ${CRON_SECRET}"

run_job() {
  local name="$1"
  local method="${2:-GET}"
  local path="$3"
  local url="${APP_BASE_URL}${path}"

  echo "[$(date -Iseconds)] cron ${name} → ${method} ${url}"
  if [[ "$method" == "GET" ]]; then
    curl -fsS -m 120 -H "$AUTH_HEADER" "$url" || {
      echo "FALHOU: ${name}" >&2
      return 1
    }
  else
    curl -fsS -m 120 -X POST -H "$AUTH_HEADER" "$url" || {
      echo "FALHOU: ${name}" >&2
      return 1
    }
  fi
  echo ""
}

job_release_holds() {
  run_job "release-holds" GET "/api/cron/release-holds"
}

job_ticket_alerts() {
  run_job "ticket-alerts" GET "/api/cron/ticket-alerts"
}

job_email_schedulers() {
  run_job "email-schedulers" GET "/api/cron/email-schedulers"
}

job_release_balances() {
  run_job "release-balances" GET "/api/cron/finance/release-balances"
}

job_auto_settlements() {
  run_job "auto-settlements" GET "/api/cron/finance/auto-settlements"
}

case "${1:-all}" in
  release-holds)      job_release_holds ;;
  ticket-alerts)      job_ticket_alerts ;;
  email-schedulers)   job_email_schedulers ;;
  release-balances)   job_release_balances ;;
  auto-settlements)   job_auto_settlements ;;
  all)
    job_release_holds
    job_ticket_alerts
  ;;
  *)
    echo "Jobs: release-holds | ticket-alerts | email-schedulers | release-balances | auto-settlements | all"
    exit 1
    ;;
esac

echo "[$(date -Iseconds)] OK: ${1:-all}"
