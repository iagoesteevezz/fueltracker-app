// ============================================================
// src/models/refuel.model.js — Modelo de Repostaje
// ============================================================
// El modelo es la capa responsable de hablar con la base de datos.
// Aquí viven todas las queries SQL relacionadas con 'refuels'.
//
// Patrón de arquitectura: separamos las queries (modelo) de la
// lógica HTTP (controlador). Ventaja: si mañana cambias de
// PostgreSQL a otro motor, solo tocas esta capa.
// ============================================================

const { query } = require('../db/connection');

// ── Calcular el consumo ──────────────────────────────────────
// Esta función encapsula la fórmula de negocio más importante
// del proyecto. Al centralizarla aquí (en vez de repetirla en
// varios sitios) garantizamos consistencia: si la fórmula cambia,
// solo hay un lugar donde tocarla.
//
// Fórmula: (litros / kilómetros) × 100 = L/100km
// parseFloat + toFixed(2): evitamos que JavaScript devuelva
// valores como 6.666666666666667 — lo redondeamos a 2 decimales.
const calcularConsumo = (liters_filled, km_since_last) => {
  const consumo = (liters_filled / km_since_last) * 100;
  return parseFloat(consumo.toFixed(2));
};


// ── Crear un repostaje ───────────────────────────────────────
// Recibe los datos del controlador, calcula el consumo y persiste.
// Ahora incluye user_id para vincular el repostaje con un usuario.
const crear = async (datos, userId) => {
  const {
    refuel_date,
    km_since_last,
    liters_filled,
    price_per_liter = null,
    notes = null,
  } = datos;

  const normalizedDate = new Date(refuel_date).toISOString().split('T')[0];

  const avg_consumption = calcularConsumo(liters_filled, km_since_last);

  const resultado = await query(
    `INSERT INTO refuels
       (refuel_date, km_since_last, liters_filled, price_per_liter, avg_consumption, notes, user_id)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [normalizedDate, km_since_last, liters_filled, price_per_liter, avg_consumption, notes, userId]
  );

  return resultado.rows[0];
};


// ── Obtener repostajes de un usuario ────────────────────────
// Solo devuelve los repostajes que pertenecen al usuario especificado.
const obtenerTodos = async (userId) => {
  const resultado = await query(
    `SELECT
       id,
       refuel_date,
       km_since_last,
       liters_filled,
       price_per_liter,
       avg_consumption,
       notes,
       user_id,
       created_at
     FROM refuels
     WHERE user_id = $1
     ORDER BY refuel_date DESC, created_at DESC`,
    [userId]
  );

  return resultado.rows;
};

// ── Obtener un repostaje por ID y verificar que pertenece al usuario ─
const obtenerPorId = async (id, userId) => {
  const resultado = await query(
    `SELECT *
     FROM refuels
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  return resultado.rows[0] || null;
};

const actualizar = async (id, datos, userId) => {
  const {
    refuel_date,
    km_since_last,
    liters_filled,
    price_per_liter = null,
    notes = null,
  } = datos;

  const normalizedDate = new Date(refuel_date).toISOString().split('T')[0];

  const avg_consumption = calcularConsumo(liters_filled, km_since_last);

  const resultado = await query(
    `UPDATE refuels
       SET refuel_date     = $1,
           km_since_last   = $2,
           liters_filled   = $3,
           price_per_liter = $4,
           avg_consumption = $5,
           notes           = $6
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [normalizedDate, km_since_last, liters_filled, price_per_liter, avg_consumption, notes, id, userId]
  );

  return resultado.rows[0] || null;
};

const eliminar = async (id, userId) => {
  const resultado = await query(
    `DELETE FROM refuels
      WHERE id = $1 AND user_id = $2
      RETURNING id`,
    [id, userId]
  );

  return resultado.rows[0] || null;
};

module.exports = { crear, obtenerTodos, calcularConsumo, actualizar, eliminar, obtenerPorId };
