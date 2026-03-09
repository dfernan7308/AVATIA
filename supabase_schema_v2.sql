-- SQL para la evolución de la App DiegoIA (Versión Proyectos e Historial)

-- 1. Tabla de Proyectos
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Chats (Sesiones individuales dentro de un proyecto)
CREATE TABLE IF NOT EXISTS chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Modificar Tabla de Mensajes
-- Primero eliminamos la antigua si existe para recrearla con la nueva estructura
DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model TEXT NOT NULL,
    attachment_url TEXT, -- Aquí se guarda la data URL o link del archivo
    attachment_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Habilitar Seguridad
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total proyectos" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total chats" ON chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total mensajes" ON messages FOR ALL USING (true) WITH CHECK (true);

-- 5. Insertar un proyecto por defecto
INSERT INTO projects (name, description) VALUES ('Mi Primer Proyecto', 'Espacio general para consultas');
