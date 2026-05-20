// ============================================================
// src/middlewares/auth.middleware.js — Middleware de Autenticación
// ============================================================
// Verifica que el cliente incluya un JWT válido en el header.
// Si es válido, extrae la información del usuario y la adjunta a req.user.
// Si no es válido o no existe, devuelve 401 Unauthorized.
//
// Uso: router.get('/protected', autenticar, controlador)
// ============================================================

const jwt = require('jsonwebtoken');

const autenticar = (req, res, next) => {
  try {
    // El cliente debe enviar el token en el header Authorization
    // Formato esperado: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación',
      });
    }

    // Dividimos "Bearer <token>" en partes
    const partes = authHeader.split(' ');
    if (partes.length !== 2 || partes[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Usa: Bearer <token>',
      });
    }

    const token = partes[1];

    // Verificamos el token con la misma clave usada para firmarlo
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-clave-secreta-super-segura');

    // Adjuntamos la información del usuario a req.user para que los
    // controladores puedan acceder a req.user.userId, req.user.username, etc.
    req.user = decoded;

    // Pasamos el control al siguiente middleware/controlador
    next();

  } catch (error) {
    // jwt.verify lanza errores específicos:
    // - TokenExpiredError: token expirado
    // - JsonWebTokenError: token inválido o mal formado
    // - NotBeforeError: token no activo aún
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'El token ha expirado',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    console.error('[autenticar] Error en JWT:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Error de autenticación',
    });
  }
};

module.exports = { autenticar };
