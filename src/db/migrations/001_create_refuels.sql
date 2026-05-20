-- ============================================================
-- Migración 001: Tabla de repostajes
-- ============================================================
-- Una "migración" es un archivo versionado que describe cambios
-- en la base de datos. Al numerarlos (001, 002...) garantizamos
-- que siempre se aplican en el mismo orden en cualquier entorno
-- (tu máquina, la de un compañero, producción...).
-- ============================================================

CREATE TABLE IF NOT EXISTS refuels (

  -- SERIAL: PostgreSQL crea automáticamente una secuencia
  -- numérica incremental (1, 2, 3...). Es el identificador
  -- único de cada fila. PRIMARY KEY implica NOT NULL + UNIQUE.
  id              SERIAL          PRIMARY KEY,

  -- La fecha del repostaje. Usamos DATE (sin hora) porque para
  -- este dominio no necesitamos precisión de minutos.
  -- DEFAULT CURRENT_DATE: si no se envía fecha, se usa hoy.
  refuel_date     DATE            NOT NULL DEFAULT CURRENT_DATE,

  -- Kilómetros recorridos desde el último repostaje.
  -- NUMERIC(8,2): número de hasta 8 dígitos en total, 2 decimales.
  -- Es más preciso que FLOAT para valores monetarios/físicos
  -- porque no tiene errores de representación binaria.
  -- CHECK: PostgreSQL rechazará a nivel de BD cualquier valor <= 0,
  -- una segunda línea de defensa además de la validación en código.
  km_since_last   NUMERIC(8,2)    NOT NULL CHECK (km_since_last > 0),

  -- Litros echados en este repostaje.
  liters_filled   NUMERIC(6,3)    NOT NULL CHECK (liters_filled > 0),

  -- Precio por litro (opcional, útil para calcular gasto total).
  -- NULL permitido: el usuario puede no querer apuntarlo.
  price_per_liter NUMERIC(5,3),

  -- Consumo calculado: (liters_filled / km_since_last) * 100
  -- Lo guardamos calculado para no repetir la operación en cada
  -- consulta de estadísticas. Es un patrón de "desnormalización
  -- controlada": sacrificamos un poco de pureza relacional a cambio
  -- de rendimiento y simplicidad en las queries de lectura.
  avg_consumption NUMERIC(5,2)    NOT NULL,

  -- Notas libres del usuario.
  notes           TEXT,

  -- TIMESTAMPTZ: timestamp CON zona horaria. Siempre mejor que
  -- TIMESTAMP a secas, ya que PostgreSQL lo almacena en UTC y lo
  -- convierte a la zona local al leer. Evita bugs al cambiar de hora.
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()

);

-- Índice en vehicle_date para acelerar las consultas de histórico
-- ordenadas por fecha (que serán las más frecuentes).
-- Un índice es una estructura auxiliar que permite a PostgreSQL
-- encontrar filas sin escanear toda la tabla.
CREATE INDEX IF NOT EXISTS idx_refuels_date ON refuels (refuel_date DESC);

-- Comentario en la propia tabla (visible con \dt+ en psql)
COMMENT ON TABLE refuels IS 'Registro histórico de repostajes de combustible';
COMMENT ON COLUMN refuels.avg_consumption IS 'Consumo en L/100km, calculado al insertar';
