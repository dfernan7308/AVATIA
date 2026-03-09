-- SQL para crear la tabla de la aplicación DiegoIA
-- Ejecuta esto en el "SQL Editor" de tu panel de Supabase

-- 1. Crear la tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model TEXT NOT NULL,
    attachment_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Habilitar Seguridad de Nivel de Fila (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 3. Crear una política para permitir acceso total (Lectura/Escritura/Borrado) 
-- Como es una app para uso personal tuyo, esto es lo más sencillo.
CREATE POLICY "Acceso total para Diego" ON messages
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 4. Opcional: Índice para búsquedas más rápidas en el futuro
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
