# KwiK Frontend

This is a simple Next.js frontend wired to the FastAPI backend in `backend/`.

## Development

```bash
npm install
npm run dev
```

By default the app calls `http://localhost:8000`. Override it with:

```bash
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000 npm run dev
```
