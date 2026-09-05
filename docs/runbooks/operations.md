# Warehouse Operations Runbook

This runbook covers production checks for `warehouse-microservice` in Kubernetes namespace `statex-apps`.

## Deploy

Use a unique image tag for any production rollout so Kubernetes creates a fresh ReplicaSet:

```bash
cd /home/ssf/Documents/Github/warehouse-microservice
npm test -- --runInBand
npm run build
./scripts/deploy.sh wh-g7-ops-YYYYMMDD
```

After deploy:

```bash
curl -sk https://warehouse.alfares.cz/api/health
curl -sk https://warehouse.alfares.cz/api/ready
kubectl -n statex-apps get deploy warehouse-microservice -o jsonpath='image={.spec.template.spec.containers[0].image} ready={.status.readyReplicas} updated={.status.updatedReplicas} available={.status.availableReplicas}{"\n"}'
kubectl -n statex-apps logs deploy/warehouse-microservice --tail=120
```

Expected:

- `/api/health` reports `dependencies.database.status=up`.
- `/api/health` reports `dependencies.rabbitmq.status=up`.
- `/api/health` includes `operations.mutations` and `operations.stockEvents`.
- The running image tag matches the requested deploy tag.

## Rollback

List previous ReplicaSets and images:

```bash
kubectl -n statex-apps get rs -l app=warehouse-microservice -o custom-columns=NAME:.metadata.name,DESIRED:.spec.replicas,READY:.status.readyReplicas,IMAGE:.spec.template.spec.containers[0].image
```

Roll back to the previous Deployment revision:

```bash
kubectl -n statex-apps rollout undo deployment/warehouse-microservice
kubectl -n statex-apps rollout status deployment/warehouse-microservice --timeout=180s
curl -sk https://warehouse.alfares.cz/api/health
```

If rolling back to a specific image is required:

```bash
kubectl -n statex-apps set image deployment/warehouse-microservice app=localhost:5000/warehouse-microservice:<tag>
kubectl -n statex-apps rollout status deployment/warehouse-microservice --timeout=180s
```

## Auth Token Testing

Unauthenticated protected routes must reject requests:

```bash
curl -sk -o /dev/null -w '%{http_code}\n' https://warehouse.alfares.cz/api/stock/test-product
curl -sk -o /dev/null -w '%{http_code}\n' -X POST -H 'Content-Type: application/json' --data '{}' https://warehouse.alfares.cz/api/supplier-reconciliations
```

Expected status: `401`.

For service-token smoke tests from inside the running pod, present the
Auth-issued credential the service already mounts for that caller -> target pair,
as [`auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md`](../../../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md)
prescribes. **Never mint one, and never reuse another caller's.** Confirm only that
the credential is present, never print it:

```bash
kubectl -n statex-apps exec deploy/warehouse-microservice -c app -- sh -c \
  'echo "${SERVICE_TOKEN:+SET}"'
```

> **A previous version of this runbook told you to self-mint an HS256 token and
> smoke-test with a named static token. Both are prohibited.** The guard validates
> an Auth-issued RS256 credential; a self-minted token is unrevocable, carries a
> self-granted role, and produced an opaque 401 that invited the conclusion that
> the service was broken. Any residual static-token acceptance path is a defect to
> be removed, not a supported test route.

## Event Verification

Check RabbitMQ dependency and stock event metrics:

```bash
curl -sk https://warehouse.alfares.cz/api/health
kubectl -n statex-apps logs deploy/warehouse-microservice --tail=200 | grep -E 'stock_event_publish|stock_mutation'
```

Expected stock mutation logs include:

- `actor`
- `productId`
- `warehouseId`
- `reasonCode`
- `reference` or `orderId` when supplied
- `eventResult`

Inspect RabbitMQ exchange declaration:

```bash
kubectl -n statex-apps exec rabbitmq-0 -- rabbitmqadmin list exchanges name type durable | grep stock.events
```

Expected: `stock.events` is durable and type `topic`.

## Reservation Expiry

Expired checkout holds are processed by the `warehouse-reservation-expiry` Kubernetes CronJob. It runs every five minutes and calls the protected batch endpoint. The CronJob is a caller like any other: it presents its own Auth-issued `(caller -> target)` credential per [`auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md`](../../../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md) and never signs a token itself:

```bash
kubectl -n statex-apps get cronjob warehouse-reservation-expiry
kubectl -n statex-apps get jobs -l job=reservation-expiry --sort-by=.metadata.creationTimestamp
kubectl -n statex-apps logs job/<job-name>
```

To trigger one manual run without deploying a new image:

```bash
kubectl -n statex-apps create job --from=cronjob/warehouse-reservation-expiry warehouse-reservation-expiry-manual-$(date -u +%Y%m%d%H%M%S)
```

Expected job logs include `success:true` and a data object with `examined`, `expired`, and `failed`. Any non-zero `failed` count makes the job fail so operators can inspect reservation and stock drift before retrying.

## Mutation Failure Signal

`/api/health` and `/api/ready` expose:

```json
{
  "operations": {
    "mutations": {
      "status": "success",
      "attempts": 1,
      "failures": 0,
      "last": {
        "operation": "reserve",
        "productId": "...",
        "warehouseId": "...",
        "actor": "...",
        "reasonCode": "...",
        "reference": "...",
        "status": "success"
      }
    },
    "stockEvents": {
      "attempts": 1,
      "failures": 0,
      "lastResult": {
        "type": "stock.updated",
        "status": "published"
      }
    }
  }
}
```

If `operations.mutations.status=failure`, inspect recent `stock_mutation status=failure` logs and the `last.error` field before retrying mutations.
