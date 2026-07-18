# deploy.config.sh — declaration consumed by shared/scripts/deploy.sh.
# See shared/docs/DEPLOY_STANDARDIZATION_REPORT.md section 6/7 (Phase D) for the design.
# scripts/deploy.sh is still the live, authoritative deploy path.
#
# Real order: apply rabbitmq.yaml + standard manifests -> wait for the
# RabbitMQ StatefulSet -> run a DB migration Job (templated via __IMAGE__
# substitution, not envsubst) -> set image -> wait -> health check. The
# RabbitMQ wait + migration job happen after manifests, before set-image --
# modeled as deploy_post_manifests, same reasoning as domain-research.

SERVICE_NAME="warehouse-microservice"
PORT="3201"

IMAGES=(
  "warehouse-microservice|.||"
)

DEPLOYMENTS=(
  "warehouse-microservice|app|warehouse-microservice"
)

MANIFESTS=(rabbitmq.yaml configmap.yaml external-secret.yaml deployment.yaml service.yaml ingress.yaml reservation-expiry-cronjob.yaml)

deploy_post_manifests() {
  if [ -f "$PROJECT_ROOT/k8s/rabbitmq.yaml" ]; then
    kubectl rollout status statefulset/rabbitmq -n "$NAMESPACE" --timeout=180s
  fi

  local image="${REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}"
  kubectl delete job "${SERVICE_NAME}-migrations" -n "$NAMESPACE" --ignore-not-found=true --wait=true >/dev/null
  sed "s|__IMAGE__|${image}|g" "$PROJECT_ROOT/k8s/migration-job.yaml" | kubectl apply -f - -n "$NAMESPACE" >/dev/null
  kubectl wait --for=condition=complete "job/${SERVICE_NAME}-migrations" -n "$NAMESPACE" --timeout=180s || {
    echo "Migration job failed or timed out:" >&2
    kubectl logs "job/${SERVICE_NAME}-migrations" -n "$NAMESPACE" >&2 || true
    return 1
  }
  kubectl logs "job/${SERVICE_NAME}-migrations" -n "$NAMESPACE"
}
