// CONFIGURACIÓN DE APIS Y CLIENTES
// Las claves se cargan desde el archivo .env para mayor seguridad

export const CONFIG = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "",
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};

export const MODELS = {
    OPENAI: "gpt-4o",
    GROQ: "llama-3.3-70b-versatile",
    CEREBRAS: "llama3.1-8b",
};
