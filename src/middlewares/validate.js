// ============================================================
// src/middlewares/validate.js — Middleware de validación
// ============================================================
// Un "middleware" en Express es una función que se ejecuta
// ENTRE que llega la petición y que el controlador la procesa.
// Tiene acceso a (req, res, next):
//   - req: la petición entrante
//   - res: la respuesta que mandaremos
//   - next: función para pasar al siguiente eslabón de la cadena
//
// Separar la validación del controlador es clave: mantiene cada
// función con una única responsabilidad (principio SRP de SOLID).
// ============================================================


// ── Validar datos de un nuevo repostaje ─────────────────────
const validarRepostaje = (req, res, next) => {
  // Extraemos los campos del cuerpo de la petición.
  // Usamos desestructuración para que el código sea más legible.
  const { km_since_last, liters_filled, refuel_date, price_per_liter } = req.body;

  // Acumulamos todos los errores antes de responder.
  // Así el cliente recibe TODOS los problemas de una vez,
  // no uno a uno (mejor experiencia de usuario/developer).
  const errors = [];

  // ── km_since_last ──────────────────────────────────────────
  if (km_since_last === undefined || km_since_last === null) {
    errors.push('km_since_last es obligatorio');
  } else {
    const km = Number(km_since_last);
    if (isNaN(km)) {
      errors.push('km_since_last debe ser un número');
    } else if (km <= 0) {
      errors.push('km_since_last debe ser mayor que 0');
    } else if (km > 99999.99) {
      errors.push('km_since_last no puede superar 99.999 km');
    }
  }

  // ── liters_filled ──────────────────────────────────────────
  if (liters_filled === undefined || liters_filled === null) {
    errors.push('liters_filled es obligatorio');
  } else {
    const litros = Number(liters_filled);
    if (isNaN(litros)) {
      errors.push('liters_filled debe ser un número');
    } else if (litros <= 0) {
      errors.push('liters_filled debe ser mayor que 0');
    } else if (litros > 999.999) {
      errors.push('liters_filled no puede superar 999 litros');
    }
  }

  // ── refuel_date (opcional, pero si viene debe ser válida) ──
  if (refuel_date !== undefined) {
    const fecha = new Date(refuel_date);
    if (isNaN(fecha.getTime())) {
      errors.push('refuel_date debe tener formato YYYY-MM-DD válido');
    }
  }

  // ── price_per_liter (opcional) ─────────────────────────────
  if (price_per_liter !== undefined && price_per_liter !== null) {
    const precio = Number(price_per_liter);
    if (isNaN(precio) || precio < 0) {
      errors.push('price_per_liter debe ser un número positivo');
    }
  }

  // Si hay errores, respondemos 400 Bad Request y cortamos la cadena.
  // Al NO llamar a next(), el controlador nunca llega a ejecutarse.
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors,
    });
  }

  // Sin errores: llamamos a next() para que la petición continúe
  // hacia el controlador.
  next();
};


module.exports = { validarRepostaje };
