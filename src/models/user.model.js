// ============================================================
// src/models/user.model.js — Modelo de Usuario
// ============================================================
// Gestiona todas las operaciones relacionadas con usuarios en BD.
// Responsabilidades:
// - Registrar nuevo usuario (guardar hash de contraseña)
// - Buscar usuario por email/username para validación
// - Recuperar datos públicos del usuario
// ============================================================

const { query } = require('../db/connection');
const bcrypt = require('bcrypt');

// ── Crear usuario ───────────────────────────────────────────
// Recibe username, email y contraseña en texto plano.
// Genera hash de la contraseña antes de persistir.
// Devuelve el usuario creado (sin el hash).
const crear = async (username, email, password) => {
  // Generamos un hash seguro con 10 rondas de salt.
  // bcrypt es lento adrede: dificulta ataques de fuerza bruta.
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  try {
    const resultado = await query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    return resultado.rows[0];
  } catch (error) {
    // Si el error es de constraint unique violation (23505),
    // lo re-lanzamos con mensaje amable.
    if (error.code === '23505') {
      // Determinamos cuál de los dos unique constraints falló
      if (error.detail && error.detail.includes('username')) {
        throw new Error('El nombre de usuario ya está registrado');
      }
      if (error.detail && error.detail.includes('email')) {
        throw new Error('El email ya está registrado');
      }
    }
    throw error;
  }
};

// ── Obtener usuario por email ───────────────────────────────
// Devuelve el usuario completo (con hash) para comparación de
// contraseña durante login.
const obtenerPorEmail = async (email) => {
  const resultado = await query(
    `SELECT id, username, email, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  return resultado.rows[0] || null;
};

// ── Obtener usuario por username ────────────────────────────
// Para búsquedas por nombre de usuario.
const obtenerPorUsername = async (username) => {
  const resultado = await query(
    `SELECT id, username, email, created_at
     FROM users
     WHERE username = $1`,
    [username]
  );

  return resultado.rows[0] || null;
};

// ── Obtener usuario por ID ──────────────────────────────────
// Para recuperar datos públicos de un usuario.
const obtenerPorId = async (id) => {
  const resultado = await query(
    `SELECT id, username, email, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return resultado.rows[0] || null;
};

const actualizarNombre = async (id, username) => {
  const resultado = await query(
    `UPDATE users
     SET username = $1
     WHERE id = $2
     RETURNING id, username, email, created_at`,
    [username, id]
  );

  if (!resultado.rowCount) {
    return null;
  }

  return resultado.rows[0] || null;
};

// ── Verificar contraseña ────────────────────────────────────
// Compara la contraseña en texto plano con el hash almacenado.
// bcrypt.compare devuelve true/false de forma segura.
const verificarPassword = async (passwordPlano, passwordHash) => {
  return await bcrypt.compare(passwordPlano, passwordHash);
};

module.exports = {
  crear,
  obtenerPorEmail,
  obtenerPorUsername,
  obtenerPorId,
  actualizarNombre,
  verificarPassword,
};
