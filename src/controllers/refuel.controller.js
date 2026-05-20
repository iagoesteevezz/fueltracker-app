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
// Crea un nuevo repostaje. El middleware ya validó los datos,
// así que aquí podemos asumir que req.body es correcto.
const crearRepostaje = async (req, res) => {
  try {
    // Llamamos al modelo pasando los datos del body.
    // El modelo se encarga de calcular el consumo y persistir.
    const nuevoRepostaje = await refuelModel.crear(req.body);

    // 201 Created es el código HTTP correcto para creación exitosa.
    // (200 OK es para lecturas; 201 para creación de recursos nuevos)
    // Respondemos siempre con un envelope { success, data }:
    // así el cliente siempre sabe qué esperar, sea éxito o error.
    return res.status(201).json({
      success: true,
      message: 'Repostaje registrado correctamente',
      data: nuevoRepostaje,
    });

  } catch (error) {
    // Diferenciamos errores conocidos de errores inesperados.
    // Los errores de constraint de PostgreSQL tienen un 'code':
    //   23514 = check_violation (ej: km_since_last <= 0)
    //   23505 = unique_violation
    //   23502 = not_null_violation
    if (error.code === '23514') {
      return res.status(400).json({
        success: false,
        message: 'Los datos no cumplen las restricciones de la base de datos',
        detail: error.detail,
      });
    }

    // Para cualquier error no esperado, logueamos el stack completo
    // en el servidor (para depurar) pero al cliente solo le mandamos
    // un mensaje genérico (no exponemos internos del sistema).
    console.error('[crearRepostaje] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};


// ── GET /api/refuels ─────────────────────────────────────────
// Devuelve el histórico completo de repostajes.
const obtenerRepostajes = async (req, res) => {
  try {
    const repostajes = await refuelModel.obtenerTodos();

    // Enriquecemos la respuesta con metadatos útiles para el cliente:
    // 'total' evita que el frontend tenga que hacer repostajes.length,
    // y en el futuro nos permite añadir paginación sin romper la API.
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


module.exports = { crearRepostaje, obtenerRepostajes };
