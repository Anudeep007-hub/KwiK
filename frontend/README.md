# KwiK Frontend

This frontend is the Vite React app generated from `FigmaFrontend` and wired to the FastAPI backend in `backend/`.

## Development

```bash
npm install
npm run dev
```

By default the app calls `http://localhost:8000`. Override it with:

```bash
VITE_BACKEND_API_URL=http://localhost:8000 npm run dev
```

`NEXT_PUBLIC_BACKEND_API_URL` is also accepted for compatibility with the previous Next.js setup.
