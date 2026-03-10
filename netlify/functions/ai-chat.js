import OpenAI from 'openai';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

function getEnv(name) {
  return process.env[name] || process.env[`VITE_${name}`];
}

function buildClient({ apiKey, baseURL }) {
  return new OpenAI({ apiKey, baseURL });
}

function getProviderConfig(modelProvider) {
  switch (modelProvider) {
    case 'openai-v4':
      return {
        apiKey: getEnv('OPENAI_V4_API_KEY'),
        baseURL: 'https://api.openai.com/v1',
        modelName: 'gpt-4o',
      };
    case 'openai-v5':
      return {
        apiKey: getEnv('OPENAI_V5_API_KEY'),
        baseURL: 'https://api.openai.com/v1',
        modelName: 'gpt-5.2-chat-latest',
      };
    case 'groq':
      return {
        apiKey: getEnv('GROQ_API_KEY'),
        baseURL: 'https://api.groq.com/openai/v1',
        modelName: 'llama-3.3-70b-versatile',
      };
    case 'cerebras':
      return {
        apiKey: getEnv('CEREBRAS_API_KEY'),
        baseURL: 'https://api.cerebras.ai/v1',
        modelName: 'llama3.1-8b',
      };
    default:
      throw new Error('Proveedor no soportado');
  }
}

async function processWithGemini(messages) {
  const apiKey = getEnv('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Falta GEMINI_API_KEY');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      contents: messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Error en Gemini API');
  }

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const { attachment, messages, modelProvider } = JSON.parse(event.body || '{}');

    if (modelProvider === 'gemini') {
      const content = await processWithGemini(messages);
      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ content }) };
    }

    const systemPrompt = {
      role: modelProvider.startsWith('openai') ? 'developer' : 'system',
      content: `Eres AVATIA, un asistente experto de elite.
Si el usuario te pide generar un documento (PDF, Excel, Word/DOCX, PowerPoint/PPT):
1. Genera el contenido de forma clara y estructurada en tu respuesta de texto.
2. Para Excel: usa formato de tabla Markdown.
3. Para PPT: usa títulos y puntos clave claros.
AVATIA tiene botones especiales para convertir tu respuesta en estos archivos de forma automática.`,
    };

    const providerConfig = getProviderConfig(modelProvider);
    if (!providerConfig.apiKey) {
      throw new Error(`Falta la API key para ${modelProvider}`);
    }

    const client = buildClient(providerConfig);
    const sanitizedMessages = [systemPrompt, ...messages].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    let finalMessages = [...sanitizedMessages];
    if (attachment?.type?.startsWith('image/')) {
      const lastMessage = finalMessages[finalMessages.length - 1];
      finalMessages[finalMessages.length - 1] = {
        role: 'user',
        content: [
          { type: 'text', text: lastMessage.content },
          { type: 'image_url', image_url: { url: attachment.url } },
        ],
      };
    }

    const response = await client.chat.completions.create({
      model: providerConfig.modelName,
      messages: finalMessages,
    });

    const content = response.choices?.[0]?.message?.content || '';
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ content }) };
  } catch (error) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: error.message || 'Error interno del servidor' }),
    };
  }
}
