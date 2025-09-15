import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'devsecret';

// Mock user login (email+password -> token)
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email/password required' });
  // In real app, verify user from DB & hash compare
  const token = jwt.sign({ sub: email }, SECRET, { expiresIn: '8h' });
  res.json({ token });
});

export default router;
