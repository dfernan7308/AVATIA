-- SQL para la App DiegoIA v5
-- Base de conocimiento por usuario

CREATE TABLE IF NOT EXISTS knowledge_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_entries_user_id ON knowledge_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_updated_at ON knowledge_entries(updated_at DESC);

ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own knowledge entries" ON knowledge_entries;

CREATE POLICY "Users manage own knowledge entries"
ON knowledge_entries FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
