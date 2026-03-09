import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { CONFIG } from '../config';

// Inicializar Supabase
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// Servicios de Autenticación
export const auth = {
    signIn: async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
    },
    signUp: async (email, password) => {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: email.split('@')[0],
                }
            }
        });
    },
    signOut: async () => {
        return await supabase.auth.signOut();
    },
    getSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    }
};

// Generador de imágenes (con soporte para referencia visual)
export async function generateImage(prompt, referenceImage = null) {
    const apiKey = CONFIG.OPENAI_V5_API_KEY;
    const client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });

    let styleDescription = "";

    // Si hay una imagen de referencia, la analizamos primero con GPT-4o Vision para extraer el ADN artístico
    if (referenceImage) {
        try {
            const visionResponse = await client.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analiza el estilo artístico de esta imagen (colores, técnica, iluminación, atmósfera). Describe el estilo en 3 frases muy técnicas y precisas para que un generador de imágenes lo replique. No describas el contenido, solo el estilo visual." },
                            { type: "image_url", image_url: { url: referenceImage.url } }
                        ]
                    }
                ]
            });
            styleDescription = visionResponse.choices[0].message.content;
        } catch (err) {
            console.error("Error analizando estilo:", err);
        }
    }

    const finalPrompt = styleDescription
        ? `Generate an image with this style: ${styleDescription}. Subject of the image: ${prompt}`
        : prompt;

    const response = await client.images.generate({
        model: "dall-e-3", // Se usa DALL-E 3 por defecto
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
    });

    return response.data[0].url;
}

// Factory para los diferentes proveedores de IA
export async function processWithAI(modelProvider, messages, attachment = null) {
    let apiKey, baseURL, modelName;

    // Prompt del sistema para guiar la generación de documentos
    // NOTA: Cambiamos a 'system' por defecto ya que Groq y Cerebras no entienden 'developer'
    const systemPrompt = {
        role: (modelProvider.startsWith('openai')) ? 'developer' : 'system',
        content: `Eres AVATIA, un asistente experto de elite. 
        Si el usuario te pide generar un documento (PDF, Excel, Word/DOCX, PowerPoint/PPT):
        1. Genera el contenido de forma clara y estructurada en tu respuesta de texto.
        2. Para Excel: Usa formato de tabla Markdown.
        3. Para PPT: Usa títulos y puntos clave claros.
        AVATIA tiene botones especiales para convertir tu respuesta en estos archivos de forma automática.`
    };

    const finalMessagesForSanitizing = [systemPrompt, ...messages];

    switch (modelProvider) {
        case 'openai-v4':
            apiKey = CONFIG.OPENAI_V4_API_KEY;
            baseURL = 'https://api.openai.com/v1';
            modelName = 'gpt-4o';
            break;
        case 'openai-v5':
            apiKey = CONFIG.OPENAI_V5_API_KEY;
            baseURL = 'https://api.openai.com/v1';
            modelName = 'gpt-5.2-chat-latest';
            break;
        case 'groq':
            apiKey = CONFIG.GROQ_API_KEY;
            baseURL = 'https://api.groq.com/openai/v1';
            modelName = 'llama-3.3-70b-versatile';
            break;
        case 'cerebras':
            apiKey = CONFIG.CEREBRAS_API_KEY;
            baseURL = 'https://api.cerebras.ai/v1';
            modelName = 'llama3.1-8b'; // Actualizado a 8b que es el disponible
            break;
        default:
            throw new Error('Proveedor no soportado');
    }

    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL,
        dangerouslyAllowBrowser: true
    });

    // Sanitizar los mensajes para que solo tengan 'role' y 'content'
    const sanitizedMessages = finalMessagesForSanitizing.map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    // Si hay un adjunto (imagen), preparamos el mensaje multimodal
    let finalMessages = [...sanitizedMessages];
    if (attachment && attachment.type.startsWith('image/')) {
        const lastMessage = finalMessages[finalMessages.length - 1];
        finalMessages[finalMessages.length - 1] = {
            role: 'user',
            content: [
                { type: 'text', text: lastMessage.content },
                {
                    type: 'image_url',
                    image_url: { url: attachment.url }
                }
            ]
        };
    }

    const response = await client.chat.completions.create({
        model: modelName,
        messages: finalMessages,
        stream: true,
    });

    return response;
}
