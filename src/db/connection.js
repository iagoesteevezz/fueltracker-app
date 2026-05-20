// ============================================================
// src/db/connection.js — Conexión a PostgreSQL
// ============================================================
// Usamos el paquete 'pg' (node-postgres), el driver oficial.
// En vez de crear una conexión nueva por cada petición HTTP
// (costoso), creamos un POOL: un conjunto de conexiones
// reutilizables que se gestionan automáticamente.
// ============================================================

const { Pool } = require('pg');

// El Pool lee la variable de entorno DATABASE_URL si existe,
// o usa los parámetros individuales como fallback.
// Las variables de entorno mantienen credenciales fuera del código
// fuente (nunca hardcodees usuarios/contraseñas en el repo).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // En producción (Railway, Render...) las conexiones van cifradas
  // con SSL. En local no es necesario.
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,

  // Límites del pool:
  max: 10,              // máximo 10 conexiones simultáneas
  idleTimeoutMillis: 30000,   // cierra conexiones inactivas tras 30s
  connectionTimeoutMillis: 2000, // error si no hay conexión en 2s
});

// Evento de error global: sin esto, un error en una conexión
// inactiva crashea el proceso de Node sin posibilidad de capturarlo.
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

// Función de utilidad para ejecutar queries.
// Acepta opcionalmente un array de parámetros para usar
// "parameterized queries", que previenen SQL Injection:
//   query('SELECT * FROM refuels WHERE id = $1', [id])
// El driver sustituye $1 de forma segura, sin concatenar strings.
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
