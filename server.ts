import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Proxy endpoint for /api/decisions with no fallbacks
app.post('/api/decisions', async (req, res) => {
  const openAiKey = process.env.OPENAI_API_KEY || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (openAiKey) {
    headers['Authorization'] = `Bearer ${openAiKey}`;
  }

  const upstreamRes = await fetch('https://api.openai.com/v1/decisions', {
    method: 'POST',
    headers,
    body: JSON.stringify(req.body),
  });

  const data = await upstreamRes.json();
  res.status(upstreamRes.status).json(data);
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();
