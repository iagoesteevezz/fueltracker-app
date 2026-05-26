const carModel = require('../models/car.model');

const crearAuto = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { brand, model, year } = req.body;

    if (!brand || !model || year === undefined || year === null) {
      return res.status(400).json({
        success: false,
        message: 'brand, model y year son obligatorios',
      });
    }

    const yearNumber = Number(year);
    if (!Number.isInteger(yearNumber) || yearNumber < 1900 || yearNumber > 2100) {
      return res.status(400).json({
        success: false,
        message: 'year debe ser un entero válido entre 1900 y 2100',
      });
    }

    const nuevoAuto = await carModel.crear(userId, brand.trim(), model.trim(), yearNumber);

    return res.status(201).json({
      success: true,
      message: 'Coche registrado correctamente',
      data: nuevoAuto,
    });
  } catch (error) {
    console.error('[crearAuto] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

const obtenerCoches = async (req, res) => {
  try {
    const userId = req.user.userId;
    const coches = await carModel.obtenerPorUsuario(userId);

    return res.status(200).json({
      success: true,
      total: coches.length,
      data: coches,
    });
  } catch (error) {
    console.error('[obtenerCoches] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

const eliminarAuto = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de coche inválido',
      });
    }

    const eliminado = await carModel.eliminar(parsedId, userId);
    if (!eliminado) {
      return res.status(404).json({
        success: false,
        message: 'Coche no encontrado',
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('[eliminarAuto] Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

module.exports = { crearAuto, obtenerCoches, eliminarAuto };
