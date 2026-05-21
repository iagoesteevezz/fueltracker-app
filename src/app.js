// ============================================================
// src/app.js — Configuración de la aplicación Express
// ============================================================
// Separamos la app de Express (configuración) del servidor HTTP
// (arranque). Esto facilita enormemente los tests: los tests
// importan 'app' directamente sin levantar un puerto real.
// ============================================================

const express = require('express');
const cors    = require('cors');

const refuelRoutes = require('./routes/refuel.routes');
const userRoutes   = require('./routes/user.routes');
const carRoutes    = require('./routes/car.routes');

const app = express();


// ── Middlewares globales ─────────────────────────────────────

// cors(): permite que el frontend (que corre en otro origen,
// ej: localhost:5173) pueda hacer peticiones a esta API.
// Sin esto, el navegador bloquearía las peticiones por la
// política de "Same-Origin". En producción deberías limitar
// los orígenes permitidos:
//   cors({ origin: 'https://tuapp.vercel.app' })
app.use(cors());

// express.json(): parsea el body de las peticiones con
// Content-Type: application/json y lo deja disponible en req.body.
// Sin este middleware, req.body sería undefined.
app.use(express.json());


// ── Ruta de salud (health check) ────────────────────────────
// Convención estándar: GET /health devuelve 200 si la app está viva.
// Plataformas como Railway, Render o Kubernetes la usan para saber
// si el servicio está listo para recibir tráfico.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});


// ── Montaje de rutas ─────────────────────────────────────────
// Prefijamos todas las rutas con /api/v1. El prefijo /api deja
// claro que es una API, no una web. El prefijo /v1 nos permite
// crear una v2 en el futuro sin romper los clientes que ya usan v1.
app.use('/api/v1/refuels', refuelRoutes);
app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/cars', carRoutes);


// ── Middleware de ruta no encontrada ─────────────────────────
// Si ninguna ruta anterior coincidió, este middleware captura la
// petición y devuelve 404. Va al final, después de todas las rutas.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});


// ── Middleware global de errores ─────────────────────────────
// Express identifica los middlewares de error porque tienen 4
// parámetros: (err, req, res, next). Es el último recurso:
// captura cualquier error que llegue aquí via next(error).
app.use((err, req, res, next) => {
  console.error('[Error global]:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
});


module.exports = app;
