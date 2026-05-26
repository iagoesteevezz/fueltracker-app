const { query } = require('../db/connection');

const crear = async (userId, brand, model, year) => {
  const resultado = await query(
    `INSERT INTO public.cars (user_id, brand, model, year)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, brand, model, year, created_at`,
    [userId, brand, model, year]
  );

  return resultado.rows[0];
};

const obtenerPorUsuario = async (userId) => {
  const resultado = await query(
    `SELECT id, user_id, brand, model, year, created_at
     FROM public.cars
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return resultado.rows;
};

const obtenerPorIdYUsuario = async (id, userId) => {
  const resultado = await query(
    `SELECT id, user_id, brand, model, year, created_at
     FROM public.cars
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  return resultado.rows[0] || null;
};

const eliminar = async (id, userId) => {
  const resultado = await query(
    `DELETE FROM public.cars
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );

  return resultado.rowCount > 0;
};

module.exports = { crear, obtenerPorUsuario, obtenerPorIdYUsuario, eliminar };
