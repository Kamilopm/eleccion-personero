-- ============================================
-- SCRIPT SQL PARA SISTEMA DE VOTACIÓN ESCOLAR
-- ============================================
-- Ejecutar este script completo en el SQL Editor de Supabase

-- 1. TABLA DE CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    election_status TEXT NOT NULL DEFAULT 'closed' CHECK (election_status IN ('open', 'closed')),
    admin_code TEXT NOT NULL DEFAULT 'ADMIN2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_config_row CHECK (id = 1)
);

-- Insertar configuración inicial
INSERT INTO config (id, election_status, admin_code)
VALUES (1, 'closed', 'ADMIN2026')
ON CONFLICT (id) DO NOTHING;

-- 2. TABLA DE ESTUDIANTES
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    grade INTEGER NOT NULL CHECK (grade > 0 AND grade <= 13),
    course INTEGER NOT NULL CHECK (course > 0),
    list_number INTEGER NOT NULL CHECK (list_number > 0),
    access_code TEXT NOT NULL UNIQUE,
    has_voted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    voted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_students_access_code ON students(access_code);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_has_voted ON students(has_voted);

-- 3. TABLA DE CANDIDATOS
CREATE TABLE IF NOT EXISTS candidates (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    party TEXT NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE VOTOS (registro de auditoría)
CREATE TABLE IF NOT EXISTS votes (
    id BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);

-- ============================================
-- FUNCIÓN ATÓMICA PARA EMITIR VOTO
-- ============================================
-- Esta función garantiza que el voto se registre correctamente
-- o falle completamente (transacción atómica)

CREATE OR REPLACE FUNCTION cast_vote(
    p_access_code TEXT,
    p_candidate_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id BIGINT;
    v_has_voted BOOLEAN;
BEGIN
    -- 1. Verificar que el código de acceso existe y obtener info del estudiante
    SELECT id, has_voted INTO v_student_id, v_has_voted
    FROM students
    WHERE access_code = p_access_code
    FOR UPDATE; -- Bloquear fila para evitar condiciones de carrera

    -- Si no existe el código
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Código de acceso no encontrado';
    END IF;

    -- Si ya votó
    IF v_has_voted = TRUE THEN
        RAISE EXCEPTION 'Ya has votado';
    END IF;

    -- 2. Verificar que el candidato existe
    IF NOT EXISTS (SELECT 1 FROM candidates WHERE id = p_candidate_id) THEN
        RAISE EXCEPTION 'Candidato no existe';
    END IF;

    -- 3. Marcar al estudiante como votado
    UPDATE students
    SET has_voted = TRUE,
        voted_at = NOW()
    WHERE id = v_student_id;

    -- 4. Insertar el voto en la tabla de votos
    INSERT INTO votes (candidate_id)
    VALUES (p_candidate_id);

    -- 5. Incrementar el contador del candidato
    UPDATE candidates
    SET votes = votes + 1
    WHERE id = p_candidate_id;

    -- Todo salió bien
    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        -- Si hay cualquier error, hacer rollback automático
        RAISE EXCEPTION 'Error al registrar voto: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- ============================================
-- COMENTARIOS Y POLÍTICAS DE SEGURIDAD
-- ============================================

COMMENT ON TABLE config IS 'Configuración global del sistema (una sola fila)';
COMMENT ON TABLE students IS 'Estudiantes registrados con sus códigos de votación';
COMMENT ON TABLE candidates IS 'Candidatos participantes en la elección';
COMMENT ON TABLE votes IS 'Registro de votos emitidos (auditoría)';
COMMENT ON FUNCTION cast_vote IS 'Función atómica para emitir un voto de forma segura';

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL - DESCOMENTAR SI QUIERES PROBAR)
-- ============================================

-- Insertar candidatos de ejemplo
-- INSERT INTO candidates (name, party, votes) VALUES
-- ('Juan Pérez', 'Lista A', 0),
-- ('María González', 'Lista B', 0),
-- ('Carlos Rodríguez', 'Lista C', 0);

-- Insertar estudiantes de ejemplo
-- INSERT INTO students (full_name, grade, course, list_number, access_code, has_voted) VALUES
-- ('Ana Martínez', 6, 1, 12, '6112', FALSE),
-- ('Luis Torres', 7, 2, 3, '7203', FALSE),
-- ('Sofia Ramírez', 8, 1, 5, '8105', FALSE);

-- ============================================
-- VERIFICACIÓN DE INSTALACIÓN
-- ============================================

-- Verificar que todo se creó correctamente
SELECT 'Tablas creadas' AS status;
SELECT COUNT(*) AS total_students FROM students;
SELECT COUNT(*) AS total_candidates FROM candidates;
SELECT COUNT(*) AS total_votes FROM votes;
SELECT election_status, admin_code FROM config WHERE id = 1;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. El código de administrador por defecto es: ADMIN2026
-- 2. La votación inicia en estado 'closed'
-- 3. Los códigos de votación siguen el formato: <grado><curso><lista>
-- 4. La función cast_vote es atómica y previene doble votación
-- 5. Todos los votos quedan registrados para auditoría
-- ============================================
