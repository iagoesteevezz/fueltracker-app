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
const { crearRepostaje, obtenerRepostajes, actualizarRepostaje, eliminarRepostaje } = require('../controllers/refuel.controller');
const { validarRepostaje } = require('../middlewares/validate');
const { autenticar } = require('../middlewares/auth.middleware');

const router = Router();

// ── Middleware de autenticación ──────────────────────────────
// Todas las rutas de repostajes requieren un JWT válido.
// El middleware extrae req.user con la info del usuario autenticado.
router.use(autenticar);

// ── Cadena de middlewares ────────────────────────────────────
// Para POST y PUT:
//   1. autenticar (ya aplicado arriba a todo el router)
//   2. validarRepostaje (valida los datos)
//   3. controlador (crea/actualiza)
//
// Para GET y DELETE: solo autenticar + controlador

router.post('/', validarRepostaje, crearRepostaje);
router.put('/:id', validarRepostaje, actualizarRepostaje);
router.get('/', obtenerRepostajes);
router.delete('/:id', eliminarRepostaje);

module.exports = router;
