// ============================================================
// src/server.js — Punto de entrada de la aplicación
// ============================================================
// Este archivo solo hace UNA cosa: arrancar el servidor HTTP.
// La lógica de la app vive en app.js.
// ============================================================

// dotenv carga las variables del archivo .env en process.env.
// Debe ejecutarse lo antes posible, antes de que cualquier otro
// módulo intente leer variables de entorno.
require('dotenv').config();

const app  = require('./app');
const { pool } = require('./db/connection');

const PORT = process.env.PORT || 3000;

// Antes de arrancar, verificamos que la conexión a la BD funciona.
// Si la BD no está disponible, preferimos fallar aquí claramente
// en vez de arrancar y que los endpoints fallen uno a uno.
const iniciar = async () => {
  try {
    // pool.query devuelve una promesa; si la conexión falla, lanza error.
    await pool.query('SELECT 1');
    console.log('✅ Conexión a PostgreSQL establecida');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor arrancado en http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`⛽ API Repostajes: http://localhost:${PORT}/api/v1/refuels`);
      console.log(`👤 API Auth (register/login): http://localhost:${PORT}/api/v1/auth`);
    });
  } catch (error) {
    console.error('❌ No se pudo conectar a PostgreSQL:', error.message);
    console.error('   Comprueba que PostgreSQL está corriendo y que DATABASE_URL en .env es correcta');
    process.exit(1); // Salimos con código de error (no 0)
  }
};

iniciar();
