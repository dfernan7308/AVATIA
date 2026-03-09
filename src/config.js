// CONFIGURACIÓN DE APIS Y CLIENTES
// Las claves se cargan desde el archivo .env para mayor seguridad

export const CONFIG = {
    OPENAI_V4_API_KEY: import.meta.env.VITE_OPENAI_V4_API_KEY || "",
    OPENAI_V5_API_KEY: import.meta.env.VITE_OPENAI_V5_API_KEY || "",
    GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || "",
    CEREBRAS_API_KEY: import.meta.env.VITE_CEREBRAS_API_KEY || "",

    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "",
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};

export const MODELS = {
    OPENAI: "gpt-4o",
    GROQ: "llama-3.3-70b-versatile",
    CEREBRAS: "llama3.1-8b",
};
