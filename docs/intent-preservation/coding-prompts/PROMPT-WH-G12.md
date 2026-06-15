# PROMPT-WH-G12 - Automatic Reservation Expiry

Implement WH-G12-T1 in `warehouse-microservice`: expire timed-out active reservations automatically without relying on manual `/reservations/expire` calls. Use a Kubernetes CronJob or explicit worker endpoint rather than a hidden in-process loop. Reuse existing reservation lifecycle transaction logic, require the fixed actor `warehouse-reservation-expiry-cron` and reason `RESERVATION_TTL_EXPIRED`, preserve append-only movement evidence, do not deploy, and do not mutate production stock during validation.
