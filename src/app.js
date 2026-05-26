// ============================================================
// src/app.js — Configuración de la aplicación Express
// ============================================================

const express = require('express');
const cors    = require('cors');

const refuelRoutes = require('./routes/refuel.routes');
const userRoutes   = require('./routes/user.routes');
const carRoutes    = require('./routes/car.routes');

const app = express();

// ── Middlewares globales ─────────────────────────────────────

// Configuración de CORS activa para que tu Live Server (puerto 5500) pueda hablar con la API
app.use(cors({
  origin: 'http://127.0.0.1:5500', 
  credentials: true
}));

// Parsea el body de las peticiones con Content-Type: application/json
app.use(express.json());


// ── Ruta de salud (health check) ────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});


// ── Montaje de rutas ─────────────────────────────────────────
app.use('/api/v1/refuels', refuelRoutes);
app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/cars', carRoutes);


// ── Middleware de ruta no encontrada ─────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});


// ── Middleware global de errores ─────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error global]:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
});

module.exports = app;