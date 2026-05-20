// ============================================================
// src/controllers/user.controller.js — Controlador de Usuario
// ============================================================
// Gestiona las peticiones HTTP de autenticación.
// Responsabilidades:
// - Registrar nuevo usuario (endpoint POST /auth/register)
// - Autenticar usuario y devolver JWT (endpoint POST /auth/login)
// ============================================================

const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

// ── Generar JWT ─────────────────────────────────────────────
// Crea un token con info mínima del usuario.
// El token se firma con JWT_SECRET desde .env
const generarToken = (userId, username) => {
  const payload = {
    userId,
    username,
  };

  // expiresIn: token válido 24 horas
  // Si quieres cambiar: '7d' = 7 días, '30d' = 30 días, etc.
  return jwt.sign(payload, process.env.JWT_SECRET || 'tu-clave-secreta-super-segura', {
    expiresIn: '24h',
  });
};

// ── POST /api/v1/auth/register ──────────────────────────────
// Registra un nuevo usuario.
// Body esperado: { username, email, password }
const registrar = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validación básica (la validación completa va en middleware)
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'username, email y password son obligatorios',
      });
    }

    // Crear usuario en BD
    const usuarioNuevo = await userModel.crear(username, email, password);

    // Generar token JWT
    const token = generarToken(usuarioNuevo.id, usuarioNuevo.username);

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      data: {
        id: usuarioNuevo.id,
        username: usuarioNuevo.username,
        email: usuarioNuevo.email,
        token,
      },
    });

  } catch (error) {
    // Capturamos el error amable de username/email duplicado
    if (error.message.includes('ya está registrado')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error('[registrar] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// ── POST /api/v1/auth/login ────────────────────────────────
// Autentica un usuario y devuelve JWT.
// Body esperado: { email, password }
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email y password son obligatorios',
      });
    }

    // Buscar usuario en BD
    const usuario = await userModel.obtenerPorEmail(email);
    if (!usuario) {
      // No revelamos si existe o no el usuario (seguridad)
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos',
      });
    }

    // Verificar contraseña
    const passwordValido = await userModel.verificarPassword(password, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos',
      });
    }

    // Generar token
    const token = generarToken(usuario.id, usuario.username);

    return res.status(200).json({
      success: true,
      message: 'Autenticación exitosa',
      data: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        token,
      },
    });

  } catch (error) {
    console.error('[login] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

module.exports = { registrar, login };
