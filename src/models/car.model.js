const { query } = require('../db/connection');

const crear = async (userId, brand, model, year) => {
  const resultado = await query(
    `INSERT INTO cars (user_id, brand, model, year)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, brand, model, year, created_at`,
    [userId, brand, model, year]
  );

  return resultado.rows[0];
};

const obtenerPorUsuario = async (userId) => {
  const resultado = await query(
    `SELECT id, user_id, brand, model, year, created_at
     FROM cars
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return resultado.rows;
};

const obtenerPorIdYUsuario = async (id, userId) => {
  const resultado = await query(
    `SELECT id, user_id, brand, model, year, created_at
     FROM cars
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  return resultado.rows[0] || null;
};

module.exports = { crear, obtenerPorUsuario, obtenerPorIdYUsuario };
