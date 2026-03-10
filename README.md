# AVATIA

Cliente React para chat con IA, generación de imágenes, gestión de proyectos y exportación de respuestas.

## Qué hace

- Chat persistente con OpenAI, Gemini, Groq y Cerebras.
- Generación de imágenes con DALL-E 3 o Gemini.
- Exportación de respuestas a PDF, Excel, Word y PowerPoint.
- Organización de conversaciones por proyectos o chats independientes.
- Autenticación y persistencia con Supabase.

## Arquitectura actual

- Frontend: React + Vite.
- Base de datos y auth: Supabase.
- Backend ligero: funciones de Netlify para ocultar API keys de proveedores de IA.

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno:

```bash
cp .env.example .env
```

3. Completa `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENAI_V4_API_KEY`
- `OPENAI_V5_API_KEY`
- `GROQ_API_KEY`
- `CEREBRAS_API_KEY`
- `GEMINI_API_KEY`

4. En Supabase, ejecuta [supabase_schema_v4.sql](/Users/diegofernandez/Desktop/Antigravity%20Projects/DiegoIA/supabase_schema_v4.sql).

## Desarrollo

Para desarrollar con las funciones serverless activas, usa Netlify Dev:

```bash
npx netlify dev
```

Si solo quieres revisar el frontend estático, `npm run dev` sigue levantando Vite, pero las llamadas a IA dependen de las funciones de Netlify.

## Build

```bash
npm run build
```
