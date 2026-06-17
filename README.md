<div align="center">

<img src="assets/carmentis.svg" alt="Carmentis" width="220" />

# Carmentis Indexer

### The read-optimised API that indexes the Carmentis blockchain and serves its data to your applications.

</div>

---

## Why the Indexer?

The **Carmentis Indexer** is a [NestJS](https://nestjs.com/) server that continuously reads blocks from a Carmentis
node, stores them in a local database, and exposes the result through a documented, query-friendly HTTP API. It removes
the need to talk to a blockchain node directly — instead of paginating low-level RPC and ABCI queries yourself, you get
a single, stable surface to build explorers, dashboards and back-ends on top of.

It is useful when you need to:

- **Query historical chain data efficiently** — browse blocks, microblocks, accounts, organisations, applications and
  validators without re-deriving them from the node on every request.
- **Search across the chain** — a dedicated search endpoint resolves hashes and identifiers to the right resource.
- **Serve a documented API** — every endpoint is described through Swagger UI, served out of the box under `/swagger`.
- **Stay in sync automatically** — a background synchroniser polls the node and keeps the local database up to date,
  switching to a slower cadence when the node is unreachable.
- **Verify on-chain inclusion** — fetch microblock and account proofs straight from the node through the indexer.

## Features

- **Read-only REST API** — all endpoints exposed under `/api/v1` (blocks, microblocks, accounts, organisations,
  applications, validator nodes, voting powers, virtual blockchains, chain info, gas price and node status).
- **Continuous synchronisation** — a background service ingests new blocks block-by-block and tracks the chain head,
  with healthy (1s) and degraded (10s) polling cadences.
- **Search** — resolve hashes and identifiers to their underlying resource through `/api/v1/search`.
- **Proofs** — request microblock and account inclusion proofs via the node.
- **Local storage** — blocks are persisted with [TypeORM](https://typeorm.io/), using SQLite by default.
- **Self-documenting** — Swagger UI available under `/swagger`.
- **Sync-aware** — data endpoints return `503 Service Unavailable` until the indexer has caught up with the chain head.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) (the project uses pnpm and `corepack` — run `corepack enable` if needed)
- A reachable Carmentis **node URL**

## Configuration

The Indexer is configured through **environment variables**. A minimal setup only needs the node URL — everything else
falls back to sensible defaults:

| Variable   | Description                                  | Default                                        |
|------------|----------------------------------------------|------------------------------------------------|
| `NODE_URL` | URL of the Carmentis node to index           | `https://node1.server1.devnet.carmentis.io`    |
| `PORT`     | Port the HTTP API listens on                 | `3000`                                          |

By default the indexed data is stored in a SQLite database at `data/db/db.sqlite`, which is created automatically on
first run.

```bash
export NODE_URL="http://localhost:3500"
export PORT=3000
```

## Deploy locally (by hand)

1. Clone the repository and move into it:

   ```bash
   git clone https://github.com/carmentis/indexer.git
   cd indexer
   ```

2. Install the dependencies:

   ```bash
   pnpm install
   ```

3. Configure the node URL (and optionally the port):

   ```bash
   export NODE_URL="http://localhost:3500"
   ```

4. Start the server:

   - **Production**:

     ```bash
     pnpm build
     pnpm start:prod
     ```

   - **Development** (with hot reload):

     ```bash
     pnpm start:dev
     ```

The API and Swagger UI are then available on the configured port (default `http://localhost:3000`, docs under
`/swagger`).

## Deploy with Docker

### Option A — build the image yourself

1. Build the image:

   ```bash
   docker build -t carmentis-indexer .
   ```

2. Run it, passing the node URL and persisting the database outside the container:

   ```bash
   docker run --rm --name carmentis-indexer \
     -p 3000:3000 \
     -e NODE_URL="http://localhost:3500" \
     -v "$(pwd)/data:/app/data" \
     carmentis-indexer
   ```

### Option B — use the published image

A pre-built image is available on the GitHub Container Registry:

```bash
docker run --rm --name carmentis-indexer \
  -p 3000:3000 \
  -e NODE_URL="http://localhost:3500" \
  -v "$(pwd)/data:/app/data" \
  ghcr.io/carmentis/indexer
```

> The container exposes port `3000`. If you change `PORT`, update the `-p` mapping accordingly.
> Mounting `./data` keeps the indexed database between restarts — without it, the indexer re-syncs from scratch each
> time the container is recreated.

## API overview

All endpoints are served under `/api/v1` and documented interactively in Swagger UI (`/swagger`). The main resources
are:

| Endpoint                      | Description                                         |
|-------------------------------|-----------------------------------------------------|
| `GET /api/v1/chain`           | Chain information                                   |
| `GET /api/v1/gas-price`       | Current gas price                                   |
| `GET /api/v1/search`          | Resolve a hash or identifier to a resource          |
| `GET /api/v1/blocks`          | List blocks                                         |
| `GET /api/v1/microblocks`     | List microblocks                                    |
| `GET /api/v1/microblock-proof`| Inclusion proof for a microblock                    |
| `GET /api/v1/microblock-stats`| Microblock statistics                               |
| `GET /api/v1/accounts`        | List accounts                                       |
| `GET /api/v1/account-history` | History of an account                               |
| `GET /api/v1/account-proof`   | Inclusion proof for an account                      |
| `GET /api/v1/organizations`   | List organisations                                  |
| `GET /api/v1/applications`    | List applications                                   |
| `GET /api/v1/validator-nodes` | List validator nodes                                |
| `GET /api/v1/voting-powers`   | Validator voting powers                             |
| `GET /api/v1/virtual-blockchains` | List virtual blockchains                        |
| `GET /api/v1/node-status`     | Status of the underlying node                       |

> While the indexer is still catching up with the chain head, data endpoints return `503 Service Unavailable` together
> with the current and target heights.

## Contributing

Contributions to improve or extend the Indexer are welcome. Please follow the project's coding standards and submit a
pull request.

## License

Licensed under Apache-2.0. See the [`LICENCE.txt`](./LICENCE.txt) file for details.
