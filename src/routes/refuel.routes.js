// ============================================================
// src/routes/refuel.routes.js — Definición de rutas
// ============================================================
// El router de Express actúa como un "mapa" que asocia cada
// combinación de método HTTP + URL a su controlador.
//
// Separar las rutas en su propio archivo (en vez de definirlas
// en app.js) mantiene el punto de entrada limpio y facilita
// añadir nuevos grupos de rutas (vehículos, usuarios...) sin
// que todo quede en un único archivo gigante.
// ============================================================

const { Router } = require('express');
const { crearRepostaje, obtenerRepostajes } = require('../controllers/refuel.controller');
const { validarRepostaje } = require('../middlewares/validate');

const router = Router();

// ── Cadena de middlewares ────────────────────────────────────
// Express ejecuta los handlers de izquierda a derecha.
// Para el POST, la cadena es:
//   1. validarRepostaje (middleware) → si hay errores, para aquí
//   2. crearRepostaje   (controlador) → si llega hasta aquí, los datos son válidos
//
// Esta composición es el corazón del diseño de Express:
// funciones pequeñas y reutilizables encadenadas.

router.post('/', validarRepostaje, crearRepostaje);

// El GET no necesita validación de entrada (no recibe body),
// así que va directo al controlador.
router.get('/', obtenerRepostajes);


module.exports = router;
