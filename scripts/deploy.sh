#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'

SERVICE_NAME="warehouse-microservice"
NAMESPACE="${NAMESPACE:-statex-apps}"
K8S_DIR="$PROJECT_ROOT/k8s"
REGISTRY="localhost:5000"
DEFAULT_TAG="$(cd "$PROJECT_ROOT" && git rev-parse --short HEAD 2>/dev/null || echo "build-$(date -u +%Y%m%d%H%M%S)")"
IMAGE_TAG="${1:-$DEFAULT_TAG}"
IMAGE="${REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}"
IMAGE_LATEST="${REGISTRY}/${SERVICE_NAME}:latest"

# shellcheck disable=SC1091
source "$(dirname "$PROJECT_ROOT")/shared/scripts/load-deploy-phase-timing.sh" "$PROJECT_ROOT" 2>/dev/null \
  || source "$HOME/Documents/Github/shared/scripts/load-deploy-phase-timing.sh" "$PROJECT_ROOT" \
  || { echo "Error: deploy timing library not found" >&2; exit 1; }
deploy_timing_init "$SERVICE_NAME"

preflight_service_health() {
  echo -e "${YELLOW}Preflight: checking Kubernetes and current service health...${NC}"
  if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    echo -e "${RED}Namespace not found: $NAMESPACE${NC}"
    exit 1
  fi
  if ! kubectl get nodes >/dev/null 2>&1; then
    echo -e "${RED}kubectl cannot reach cluster${NC}"
    exit 1
  fi
  BAD_PODS=$(kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" --no-headers 2>/dev/null | awk '$3 ~ /Error|CrashLoopBackOff|ImagePullBackOff|CreateContainerConfigError|CreateContainerError|ErrImagePull/ {print $1}')
  if [ -n "$BAD_PODS" ]; then
    echo -e "${RED}Service has unhealthy pods before deploy:${NC}"
    kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" -o wide || true
    exit 1
  fi
  echo -e "${GREEN}Preflight passed${NC}"
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  warehouse-microservice - Kubernetes Deployment${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

if [ ! -d "$K8S_DIR" ]; then
  echo -e "${RED}Missing k8s directory: $K8S_DIR${NC}"
  exit 1
fi

deploy_timing_run_phase "Preflight" preflight_service_health

if [ "${NODE_ENV:-}" = "production" ]; then
  deploy_timing_phase_start "Git sync"
  cd "$PROJECT_ROOT"
  git fetch origin && git stash || true && git pull origin main && git stash pop || true
  deploy_timing_phase_end "Git sync"
fi

deploy_timing_phase_start "Build image"
docker build -t "$IMAGE" -t "$IMAGE_LATEST" "$PROJECT_ROOT"
deploy_timing_phase_end "Build image"

deploy_timing_phase_start "Push image"
docker push "$IMAGE"
docker push "$IMAGE_LATEST"
deploy_timing_phase_end "Push image"

deploy_timing_phase_start "Apply Kubernetes manifests"
for manifest in rabbitmq.yaml configmap.yaml external-secret.yaml deployment.yaml service.yaml ingress.yaml reservation-expiry-cronjob.yaml; do
  [ -f "$K8S_DIR/$manifest" ] && kubectl apply -f "$K8S_DIR/$manifest" -n "$NAMESPACE"
done
deploy_timing_phase_end "Apply Kubernetes manifests"

if [ -f "$K8S_DIR/rabbitmq.yaml" ]; then
  deploy_timing_phase_start "Wait for RabbitMQ"
  kubectl rollout status statefulset/rabbitmq -n "$NAMESPACE" --timeout=180s
  deploy_timing_phase_end "Wait for RabbitMQ"
fi

run_database_migrations() {
  echo -e "${YELLOW}Running database migrations with image ${IMAGE}...${NC}"
  kubectl delete job "${SERVICE_NAME}-migrations" -n "$NAMESPACE" --ignore-not-found=true --wait=true >/dev/null
  sed "s|__IMAGE__|${IMAGE}|g" "$K8S_DIR/migration-job.yaml" | kubectl apply -f - -n "$NAMESPACE" >/dev/null
  kubectl wait --for=condition=complete job/"${SERVICE_NAME}-migrations" -n "$NAMESPACE" --timeout=180s || {
    echo -e "${RED}Migration job failed or timed out:${NC}"
    kubectl logs job/"${SERVICE_NAME}-migrations" -n "$NAMESPACE" || true
    exit 1
  }
  kubectl logs job/"${SERVICE_NAME}-migrations" -n "$NAMESPACE"
}

deploy_timing_run_phase "Database migrations" run_database_migrations

deploy_timing_phase_start "Set deployment image"
kubectl set image "deployment/${SERVICE_NAME}" app="$IMAGE" -n "$NAMESPACE"
deploy_timing_phase_end "Set deployment image"

deploy_timing_phase_start "Wait for rollout"
deploy_timing_k8s_rollout_wait kubectl "$SERVICE_NAME" "$NAMESPACE"
deploy_timing_phase_end "Wait for rollout"

deploy_timing_phase_start "Health check"
POD=$(kubectl get pod -n "$NAMESPACE" -l app=${SERVICE_NAME} --field-selector=status.phase=Running --sort-by=.metadata.creationTimestamp -o jsonpath='{.items[-1].metadata.name}')
[ -n "$POD" ] || { echo -e "${RED}No pod found${NC}"; exit 1; }
kubectl exec -n "$NAMESPACE" "$POD" -- curl -fsS "http://localhost:3201/api/health" || exit 1
deploy_timing_phase_end "Health check"

deploy_timing_finish_success "warehouse-microservice"
DEPLOY_TIMING_FINISHED=1
exit 0
