# AVATIA - Asistente IA Avanzado (ChatGPT Clone)

AVATIA es una plataforma premium que integra los modelos de IA más potentes del mercado en una interfaz elegante y funcional.

## 🚀 Características
- **Multi-Modelo**: Intercambia entre OpenAI (v4 y v5.2), Groq y Cerebras al instante.
- **Generador de Arte**: Crea imágenes artísticas con el motor de AVATIA.
- **Exportación Inteligente**: Genera documentos PDF, Excel, Word y PPT automáticamente.
- **Gestión de Proyectos**: Organiza tus chats en proyectos independientes.
- **Diseño Glassmorphism**: Interfaz moderna, oscura y fluida.

## 🛠️ Configuración

Para proteger tus credenciales, este proyecto utiliza variables de entorno.

1.  **Clonar el repositorio** e instalar dependencias:
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno**:
    Copia el archivo de ejemplo y rellénalo con tus propias llaves:
    ```bash
    cp .env.example .env
    ```

    Variables requeridas en el archivo `.env`:
    - `VITE_OPENAI_V4_API_KEY`: Tu API Key de OpenAI (GPT-4o).
    - `VITE_OPENAI_V5_API_KEY`: Tu API Key de OpenAI para el modelo 5.2.
    - `VITE_GROQ_API_KEY`: Tu llave de Groq Cloud.
    - `VITE_CEREBRAS_API_KEY`: Tu llave de Cerebras.
    - `VITE_SUPABASE_URL`: URL de tu proyecto Supabase.
    - `VITE_SUPABASE_ANON_KEY`: Anon Key de tu proyecto Supabase.

3.  **Base de Datos**:
    Ejecuta el script `supabase_schema_v3.sql` en tu editor SQL de Supabase para preparar las tablas necesarias.

## 💻 Ejecución

```bash
npm run dev
```

---
*Desarrollado para maximizar la productividad con Inteligencia Artificial.*
