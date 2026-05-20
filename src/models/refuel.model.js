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
// Devuelve el registro completo tal como quedó en la BD
// (importante: la BD puede añadir valores por defecto como created_at).
const crear = async (datos) => {
  const {
    refuel_date,
    km_since_last,
    liters_filled,
    price_per_liter = null, // si no se envía, guardamos NULL
    notes = null,
  } = datos;

  // Calculamos el consumo aquí, en el modelo, porque es lógica
  // de negocio relacionada con los datos, no con HTTP.
  const avg_consumption = calcularConsumo(liters_filled, km_since_last);

  // RETURNING *: PostgreSQL devuelve la fila insertada completa.
  // Así el cliente recibe el id real asignado por la BD,
  // el created_at generado, etc., sin necesidad de hacer un
  // segundo SELECT.
  const resultado = await query(
    `INSERT INTO refuels
       (refuel_date, km_since_last, liters_filled, price_per_liter, avg_consumption, notes)
     VALUES
       ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [refuel_date, km_since_last, liters_filled, price_per_liter, avg_consumption, notes]
  );

  // query() devuelve un objeto { rows, rowCount, ... }
  // rows[0] es la primera (y única) fila del resultado.
  return resultado.rows[0];
};


// ── Obtener todo el histórico ────────────────────────────────
// Devuelve todos los repostajes ordenados del más reciente al
// más antiguo. Para una tabla pequeña (cientos de registros)
// esto es perfectamente válido. Cuando la app crezca, aquí
// añadirías paginación (LIMIT / OFFSET) o cursores.
const obtenerTodos = async () => {
  const resultado = await query(
    `SELECT
       id,
       refuel_date,
       km_since_last,
       liters_filled,
       price_per_liter,
       avg_consumption,
       notes,
       created_at
     FROM refuels
     ORDER BY refuel_date DESC, created_at DESC`
    // Ordenamos primero por fecha del repostaje, y como desempate
    // por cuándo se introdujo el registro. Así si el usuario
    // introduce dos repostajes del mismo día, el último introducido
    // aparece primero.
  );

  return resultado.rows;
};


module.exports = { crear, obtenerTodos, calcularConsumo };
