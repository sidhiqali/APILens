## API Lens (Local)

A local NestJS API that tracks changes in OpenAPI specs, records change history, and notifies the user (in‑app, email stub, websockets).

### Run locally

1) Install dependencies
```
npm install
```

2) Start API
```
# development
npm run start:dev

# or production build
npm run build && npm run start:prod
```

3) Docs
```
http://localhost:3000/api/docs
```

### Environment

Copy `.env.example` to `.env.development` if present. Key variables:
- `MONGO_URI` – MongoDB connection
- `JWT_SECRET` – JWT signing secret
- `FRONTEND_URL` – client base URL (defaults to http://localhost:3001)

### Notes

- Email delivery is stubbed (logs to console).
- Websocket notifications require a valid JWT (sent in auth header or handshake auth).
- Health endpoints are available under `/health` (Terminus) and `/health/simple`.
