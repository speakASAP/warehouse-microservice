#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'

SERVICE_NAME="warehouse-microservice"
NAMESPACE="${NAMESPACE:-statex-apps}"
K8S_DIR="$PROJECT_ROOT/k8s"
REGISTRY="localhost:5000"
# Tag describes the WORKING TREE that is actually built, not just git HEAD:
# a tag derived from HEAD alone repeats itself when files changed without a
# commit, which makes `kubectl set image` a no-op and silently keeps the old
# image running.
compute_default_tag() {
  local head dirty root
  root="${PROJECT_ROOT:-$(pwd)}"
  head="$(git -C "$root" rev-parse --short HEAD 2>/dev/null || true)"
  if [ -z "$head" ]; then
    echo "build-$(date -u +%Y%m%d%H%M%S)"
    return
  fi
  dirty="$(git -C "$root" status --porcelain 2>/dev/null || true)"
  if [ -n "$dirty" ]; then
    echo "${head}-wt$(date -u +%Y%m%d%H%M%S)"
  else
    echo "$head"
  fi
}

DEFAULT_TAG="$(compute_default_tag)"
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
  BAD_PODS=$({
    kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" --field-selector=status.phase=Running --no-headers 2>/dev/null || true
    kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" --field-selector=status.phase=Pending --no-headers 2>/dev/null || true
  } | awk '$3 ~ /Error|CrashLoopBackOff|ImagePullBackOff|CreateContainerConfigError|CreateContainerError|ErrImagePull/ {print $1}')
  if [ -n "$BAD_PODS" ]; then
    echo -e "${RED}Service has unhealthy pods before deploy:${NC}"
    kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" -o wide || true
    exit 1
  fi
  echo -e "${GREEN}Preflight passed${NC}"
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      warehouse-microservice - Kubernetes Deployment    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

if [ ! -d "$K8S_DIR" ]; then
  echo -e "${RED}Missing k8s directory: $K8S_DIR${NC}"
  exit 1
fi

deploy_timing_run_phase "Preflight" preflight_service_health

# No git fetch/pull/stash here on purpose: the deploy ships exactly the code
# in $PROJECT_ROOT. Pulling would replace the tree being tested with origin.

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

deploy_timing_phase_start "Database migrations"
run_database_migrations
deploy_timing_phase_end "Database migrations"

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
