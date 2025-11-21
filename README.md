📌 Overview

This project implements a Smart Order Router (SOR) for Solana DEXs (Raydium & Meteora).
The system:

Accepts a trade request (tokenIn → tokenOut)

Compares quotes from Raydium & Meteora (mocked)

Selects the best route

Processes the order in a BullMQ queue

Streams real-time order status updates to the client via WebSocket

This implementation uses mock DEX data (recommended in assignment).
You can switch to real devnet execution later.

🏗 Architecture
Client
 ├── REST: POST /api/orders/execute
 └── WebSocket: /api/orders/ws?orderId=<id>

Backend (Fastify)
 ├── Routes (orders.ts)
 ├── Queue Producer (index.ts)
 ├── Queue Worker (BullMQ Worker)
 ├── Mock DEX Router
 ├── Redis Pub/Sub → WebSocket Push
 └── PostgreSQL (order persistence)

Infrastructure
 ├── Redis (Docker)
 └── PostgreSQL (Docker)

✨ Features
✔ Smart DEX Routing

Mock quotes from Raydium & Meteora with ~5% price difference.
Choose lowest effective price.

✔ Background Job Processing

Orders are not processed inline — they run inside a BullMQ worker.

✔ WebSocket Live Updates

Client receives every stage:

pending → routing → building → submitted → confirmed

✔ Redis Pub/Sub

Worker publishes events → WS route pushes to frontend.

✔ Implements assignment requirements

DEX routing logic

WebSocket lifecycle

Queue concurrency

Retry logic

Proper architecture

Real-time streaming

Clean code + modular design

🐳 Setup (Local + Docker)
1. Clone repo
git clone https://github.com/<your-username>/eterna-router
cd eterna-router/backend

2. Start Redis + Postgres
docker compose up -d


Check:

docker compose ps


You should see:

Redis on 6379

Postgres on 5433

3. Install dependencies
npm install

4. Start backend
npm run dev


Output should show:

QUEUE: Starting worker...
WORKER READY
Server listening at http://127.0.0.1:3000

🧪 How to Test the System
Step 1 — Create an order

(PowerShell)

curl -Method POST http://127.0.0.1:3000/api/orders/execute `
  -Headers @{ "Content-Type"="application/json" } `
  -Body '{ "tokenIn":"USDC", "tokenOut":"SOL", "amount":10 }'


Response:

{ "orderId": "cd4554df-47a3-4bf5-9024-3e17bc180220" }

Step 2 — Subscribe to WebSocket
wscat -c "ws://127.0.0.1:3000/api/orders/ws?orderId=<id>"


You will receive live events like:

{"status":"pending"}
{"status":"routing"}
{"status":"building"}
{"status":"submitted"}
{"status":"confirmed","txHash":"MOCKTX_abc123","executedPrice":9.83}

📬 API Reference
POST /api/orders/execute

Creates an order and pushes it into the queue.

Body:
{
  "side": "buy",
  "tokenIn": "USDC",
  "tokenOut": "SOL",
  "amount": 10
}

Response:
{
  "orderId": "uuid"
}

WebSocket: /api/orders/ws

Subscribe to order updates.

Example:
ws://127.0.0.1:3000/api/orders/ws?orderId=<uuid>

🔧 Technologies Used

Node.js + Fastify

BullMQ + Redis

PostgreSQL

WebSocket

Mock DEX Router

Docker Compose

🧪 Tests (Required by Assignment)

This repo includes:

10 unit tests

5 integration tests

Covers:

DEX routing logic

Queue behaviour

WebSocket lifecycle

Retry logic

Pub/Sub messaging

Run tests:

npm test

📁 Postman / Insomnia Collection

Postman collection available at:

/postman/eterna_router_collection.json


It contains:

Execute order (POST)

WebSocket subscription

Sample test orders

🌐 Deployment

Backend deployed on:

<your-public-url>


(TODO: add after deploying on Railway / Render)

🎥 Video Demo (required)

YouTube video link:

<your-video-link>


Video shows:

3–5 simultaneous orders

WebSocket live updates

Queue concurrency

Routing decision logs

Worker execution

📝 Design Decisions

✔ Queue-based architecture ensures high scalability
✔ WebSocket only for streaming (not polling)
✔ Redis pub/sub decouples worker ↔ websocket
✔ Mock DEX layer makes whole system predictable
✔ Separation of concerns

routes/ for HTTP

queue/ for workers

services/MockDexRouter

pubsub/ for WS events