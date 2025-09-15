import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import auth from './routes/auth.js';
import sensors from './routes/sensors.js';
import { connectMongo, connectPostgres } from './db/index.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 4000;

// DBs (optional to run without)
connectMongo(process.env.MONGO_URL || 'mongodb://localhost:27017/hack8r').catch(()=>{});
connectPostgres().catch(()=>{});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', auth);
app.use('/api/sensors', sensors);

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
