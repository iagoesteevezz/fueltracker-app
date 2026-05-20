// ============================================================
// src/controllers/refuel.controller.js — Controlador
// ============================================================
// El controlador es la capa HTTP: recibe la petición, habla con
// el modelo, y formatea la respuesta. No contiene lógica de BD
// (eso es el modelo) ni lógica de validación (eso es el middleware).
//
// Cada función de controlador = un endpoint de la API.
// Patrón: async/await con try/catch para capturar errores y
// devolver siempre una respuesta JSON estructurada.
// ============================================================

const refuelModel = require('../models/refuel.model');


// ── POST /api/refuels ────────────────────────────────────────
// Crea un nuevo repostaje. El usuario autenticado es propietario.
const crearRepostaje = async (req, res) => {
  try {
    // req.user viene del middleware de autenticación
    const userId = req.user.userId;

    // Llamamos al modelo pasando los datos del body y el userId
    const nuevoRepostaje = await refuelModel.crear(req.body, userId);

    return res.status(201).json({
      success: true,
      message: 'Repostaje registrado correctamente',
      data: nuevoRepostaje,
    });

  } catch (error) {
    if (error.code === '23514') {
      return res.status(400).json({
        success: false,
        message: 'Los datos no cumplen las restricciones de la base de datos',
        detail: error.detail,
      });
    }

    console.error('[crearRepostaje] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};


// ── GET /api/refuels ─────────────────────────────────────────
// Devuelve los repostajes del usuario autenticado.
const obtenerRepostajes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const repostajes = await refuelModel.obtenerTodos(userId);

    return res.status(200).json({
      success: true,
      total: repostajes.length,
      data: repostajes,
    });

  } catch (error) {
    console.error('[obtenerRepostajes] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};


// ── PUT /api/refuels/:id ─────────────────────────────────────
// Actualiza un repostaje si pertenece al usuario autenticado.
const actualizarRepostaje = async (req, res) => {
  try {
    const refuelId = Number(req.params.id);
    const userId = req.user.userId;

    if (Number.isNaN(refuelId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de repostaje inválido',
      });
    }

    const repostajeActualizado = await refuelModel.actualizar(refuelId, req.body, userId);
    if (!repostajeActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Repostaje no encontrado o no tienes permiso para modificarlo',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Repostaje actualizado correctamente',
      data: repostajeActualizado,
    });

  } catch (error) {
    if (error.code === '23514') {
      return res.status(400).json({
        success: false,
        message: 'Los datos no cumplen las restricciones de la base de datos',
        detail: error.detail,
      });
    }

    console.error('[actualizarRepostaje] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};


// ── DELETE /api/refuels/:id ──────────────────────────────────
// Elimina un repostaje si pertenece al usuario autenticado.
const eliminarRepostaje = async (req, res) => {
  try {
    const refuelId = Number(req.params.id);
    const userId = req.user.userId;

    if (Number.isNaN(refuelId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de repostaje inválido',
      });
    }

    const eliminado = await refuelModel.eliminar(refuelId, userId);
    if (!eliminado) {
      return res.status(404).json({
        success: false,
        message: 'Repostaje no encontrado o no tienes permiso para eliminarlo',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Repostaje eliminado correctamente',
      data: { id: refuelId },
    });

  } catch (error) {
    console.error('[eliminarRepostaje] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

module.exports = { crearRepostaje, obtenerRepostajes, actualizarRepostaje, eliminarRepostaje };
