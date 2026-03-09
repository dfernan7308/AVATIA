-- SQL para la App DiegoIA v3 (Proyectos + Chats Independientes)

-- 1. Tabla de Proyectos
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Chats (project_id es opcional para chats independientes)
CREATE TABLE IF NOT EXISTS chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- Nullable para chats independientes
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Mensajes
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- Opcional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Habilitar Seguridad (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total v3 proyectos" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total v3 chats" ON chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total v3 mensajes" ON messages FOR ALL USING (true) WITH CHECK (true);
