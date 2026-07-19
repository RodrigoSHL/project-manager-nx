# Deployment

This repo is prepared to deploy the Nx monorepo on a single VM with Docker Compose.

For the complete workflow to add another frontend, API, BFF integration,
database, subdomain, and OCI deployment, see
[`docs/ADDING_APPLICATION_OCI.md`](docs/ADDING_APPLICATION_OCI.md).

For an existing application, use the guarded interactive deployment flow:

```bash
npm run deploy:oci
```

Run `npm run deploy:oci:dry-run` first to inspect the exact remote file changes
without modifying production.

## Local production smoke test

```sh
cp env.deploy.example .env.deploy
docker compose --env-file .env.deploy -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.deploy -f docker-compose.prod.yml ps
```

Project web:

```text
http://localhost
```

Jira web:

```text
http://localhost:8081
```

Travel Planner:

```text
http://localhost:8082
```

BFF health:

```text
http://localhost/api/health
```

If a previous local PostgreSQL volume was initialized with different
`DATABASE_USERNAME` or `DATABASE_PASSWORD` values, either keep those same
values in `.env.deploy` or recreate the local Compose volume before testing.
PostgreSQL only applies `POSTGRES_USER` and `POSTGRES_PASSWORD` during first
database initialization.

## Oracle VM target

Recommended first target:

- Shape: `VM.Standard.A1.Flex`
- OCPU: `2` for Always Free (`4` for a paid VM with more build headroom)
- Memory: `12 GB` for Always Free (`24 GB` for the paid 4 OCPU option)
- Boot/block volume: up to `200 GB`
- OS: Ubuntu or Oracle Linux ARM64
- Open ingress ports: `22`, `80`, `443`

Install Docker on the VM, clone the repository, create `.env.deploy`, then run the same Compose commands.

## Production notes

- `TYPEORM_SYNCHRONIZE=true` is only acceptable for the first bootstrap while migrations do not exist.
- Before real production traffic, add TypeORM migrations and set `TYPEORM_SYNCHRONIZE=false`.
- Keep PostgreSQL internal to Compose. Do not expose port `5432` publicly.
- Put database dumps in a scheduled backup and copy them to OCI Object Storage or another external store.
