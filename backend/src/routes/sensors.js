import { Router } from 'express';
import { spawn } from 'child_process';

const router = Router();

// Simple mock data endpoint for dashboard
router.get('/mock', (req, res) => {
  const now = new Date().toISOString();
  const data = {
    ts: now,
    air: { pm25: +(Math.random()*40+5).toFixed(2), pm10: +(Math.random()*80+10).toFixed(2), temp: +(Math.random()*15+20).toFixed(2), humidity: +(Math.random()*30+40).toFixed(2) },
    water: { ph: +(Math.random()*2+6.5).toFixed(2), turbidity: +(Math.random()*9+1).toFixed(2) },
    soil: { moisture: +(Math.random()*0.6+0.2).toFixed(2), temp: +(Math.random()*12+18).toFixed(2) }
  };
  res.json(data);
});

// Prediction endpoint: forwards JSON to Python ml/predict.py
router.post('/predict', (req, res) => {
  try {
    const py = spawn('python', ['ml/predict.py'], { cwd: process.cwd() });
    let out = '', err = '';
    py.stdout.on('data', d => out += d.toString());
    py.stderr.on('data', d => err += d.toString());
    py.on('close', code => {
      if (code !== 0) return res.status(500).json({ error: 'python error', details: err });
      try { return res.json(JSON.parse(out)); }
      catch { return res.status(500).json({ error: 'bad json from python', raw: out }); }
    });
    py.stdin.write(JSON.stringify(req.body || {}));
    py.stdin.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
