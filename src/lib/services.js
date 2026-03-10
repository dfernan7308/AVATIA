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

// Generador de imágenes (con soporte para referencia visual e Imagen 4)
export async function generateImage(prompt, referenceImage = null, engine = 'dalle') {
    const apiKeyGemini = CONFIG.GEMINI_API_KEY;
    const apiKeyOpenAI = CONFIG.OPENAI_V5_API_KEY;

    let detailedPrompt = prompt;

    // Si hay una imagen de referencia, usamos Gemini 2.5 Flash para "entenderla" y fusionarla con el prompt del usuario
    if (referenceImage) {
        try {
            const visionUrl = `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyGemini}`;
            // Extraer solo la parte base64 (remover 'data:image/png;base64,')
            const base64Data = referenceImage.url.split(',')[1];

            const visionResponse = await fetch(visionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: `Analyze this image. The user wants to generate a NEW image based on this one but with this change: "${prompt}". Create a highly descriptive English prompt for an image generator (DALL-E 3 or Imagen 4) that keeps the exact composition, subject, and style, but applies the change naturally. Respond ONLY with the new English prompt.` },
                            { inline_data: { mime_type: referenceImage.type, data: base64Data } }
                        ]
                    }],
                    generationConfig: { temperature: 0.4 }
                })
            });

            const visionData = await visionResponse.json();
            if (visionData.candidates && visionData.candidates[0].content.parts[0].text) {
                detailedPrompt = visionData.candidates[0].content.parts[0].text;
                console.log("Visual Context (Gemini):", detailedPrompt);
            }
        } catch (err) {
            console.error("Error analizando referencia visual con Gemini:", err);
        }
    }

    if (engine === 'gemini') {
        const url = `/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKeyGemini}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt: detailedPrompt }],
                parameters: { sampleCount: 1 }
            })
        });

        const data = await response.json();
        if (data.predictions && data.predictions[0]) {
            return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
        }

        console.error("Google API Error:", data);
        throw new Error(data.error?.message || "Error en Google Imagen 4");
    }

    // DALL-E 3 Flow
    const client = new OpenAI({
        apiKey: apiKeyOpenAI,
        dangerouslyAllowBrowser: true
    });

    const response = await client.images.generate({
        model: "dall-e-3",
        prompt: detailedPrompt,
        n: 1,
        size: "1024x1024",
    });

    return response.data[0].url;
}

// Handler para Chat de Gemini (Actualizado a Gemini 2.5 Flash)
async function processWithGemini(messages) {
    const apiKey = CONFIG.GEMINI_API_KEY;
    const url = `/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

    // Transformar mensajes al formato de Gemini
    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
    });

    if (!response.ok) {
        const errData = await response.json();
        console.error("Gemini Error:", errData);
        throw new Error(errData.error?.message || "Error en Gemini API");
    }

    // Retornamos un objeto compatible con el stream de OpenAI para no romper el front
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return {
        async *[Symbol.asyncIterator]() {
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const json = JSON.parse(line.replace("data: ", ""));
                            const text = json.candidates[0]?.content?.parts[0]?.text || "";
                            yield { choices: [{ delta: { content: text } }] };
                        } catch (e) { }
                    }
                }
            }
        }
    };
}

// Factory para los diferentes proveedores de IA
export async function processWithAI(modelProvider, messages, attachment = null) {
    if (modelProvider === 'gemini') {
        return await processWithGemini(messages);
    }

    let apiKey, baseURL, modelName;
    // ... rest of logic for OpenAI, Groq, Cerebras

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
