1. `.env` exists locally and is not committed.
2. `docker compose up -d` init postgres db
3. PostgreSQL is reachable with the configured `DB_*` variables.
4. `npm install` and `npm run migration:run` complete successfully.
5. `npm run start:dev` exposes Swagger docs.
