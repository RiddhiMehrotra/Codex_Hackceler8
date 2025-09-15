import mongoose from 'mongoose';
import pkg from 'pg';
const { Pool } = pkg;

export async function connectMongo(uri = 'mongodb://localhost:27017/hack8r') {
  await mongoose.connect(uri);
  console.log('Mongo connected');
}

export function connectPostgres(opts = { user:'app', password:'app123', host:'localhost', port:5432, database:'hack8r' }) {
  const pool = new Pool(opts);
  pool.query('SELECT 1').then(()=>console.log('Postgres connected')).catch(()=>{});
  return pool;
}
