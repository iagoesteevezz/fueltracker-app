// ============================================================
// src/routes/user.routes.js — Rutas de Autenticación
// ============================================================
// Define los endpoints de registro y login.
// En una app más compleja, podrías tener rutas para:
// - Refrescar token
// - Cambiar contraseña
// - Perfil del usuario
// etc.
// ============================================================

const { Router } = require('express');
const { registrar, login } = require('../controllers/user.controller');

const router = Router();

// ── POST /api/v1/auth/register ──────────────────────────────
router.post('/register', registrar);

// ── POST /api/v1/auth/login ────────────────────────────────
router.post('/login', login);

module.exports = router;
