#!/bin/bash
# Health check script

BACKEND_URL="http://localhost:8000/health"
FRONTEND_URL="http://localhost:3000"
SLACK_WEBHOOK_URL="$SLACK_WEBHOOK_URL"

check_health() {
    local url=$1
    local service=$2

    echo "Checking $service at $url..."

    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$status_code" -eq 200 ]; then
        echo "OK: $service is healthy"
        return 0
    else
        echo "ERROR: $service is unhealthy (status: $status_code)"
        send_alert "$service is down! Status: $status_code"
        return 1
    fi
}

send_alert() {
    local message=$1

    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# Check each service
check_health "$BACKEND_URL" "Backend"
check_health "$FRONTEND_URL" "Frontend"
