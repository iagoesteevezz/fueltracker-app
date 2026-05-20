-- ============================================================
-- src/db/migrations/002_create_users.sql
-- ============================================================
-- Migración: Crear tabla de usuarios y vincularla con refuels
-- ============================================================

-- ── Crear tabla de usuarios ─────────────────────────────────
-- Tabla base para autenticación. Cada usuario tiene un username
-- único, email único, y una contraseña hasheada (nunca en texto plano).
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Crear índices para búsquedas frecuentes ─────────────────
-- Mejora el rendimiento de las búsquedas por username o email
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- ── Añadir columna user_id a refuels ────────────────────────
-- Cada repostaje ahora pertenece a un usuario.
-- CASCADE DELETE: si un usuario se borra, sus repostajes también.
ALTER TABLE refuels
  ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1;

-- Después de esta migración, se puede cambiar el DEFAULT a NULL
-- y hacer que sea realmente NOT NULL, pero inicialmente vinculamos
-- todo a un usuario "por defecto" (id=1) para no romper datos existentes.

ALTER TABLE refuels
  ADD CONSTRAINT fk_refuels_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- ── Crear índice en user_id para búsquedas ──────────────────
-- Mejora las búsquedas de "todos los repostajes de un usuario"
CREATE INDEX idx_refuels_user_id ON refuels(user_id);
