import OpenAI from 'openai';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

function getEnv(name) {
  return process.env[name] || process.env[`VITE_${name}`];
}

async function generateWithGemini(prompt, referenceImage) {
  const apiKey = getEnv('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Falta GEMINI_API_KEY');
  }

  const contents = [{
    role: 'user',
    parts: [],
  }];

  if (referenceImage) {
    const base64Data = referenceImage.url.split(',')[1];
    contents[0].parts.push({
      inline_data: {
        mime_type: referenceImage.type,
        data: base64Data,
      },
    });
    contents[0].parts.push({
      text: `Use this image as the ABSOLUTE BASE. Maintain exactly the same person, pose, and background. Change ONLY this: "${prompt}". Output the modified image.`,
    });
  } else {
    contents[0].parts.push({
      text: `Generate a high-quality artistic image based on this description: "${prompt}"`,
    });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ contents }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Error en Gemini Image Generation');
  }

  const imagePart = data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
  if (!imagePart) {
    throw new Error('Gemini no devolvió una imagen');
  }

  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
}

async function generateWithDalle(prompt, referenceImage) {
  const apiKey = getEnv('OPENAI_V5_API_KEY');
  if (!apiKey) {
    throw new Error('Falta OPENAI_V5_API_KEY');
  }

  const client = new OpenAI({ apiKey });
  let detailedPrompt = prompt;

  if (referenceImage) {
    try {
      const visionResponse = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image with surgical precision. Describe EVERY detail (subject face/features, clothing, pose, lighting, exact background). The user wants a new image that is IDENTICAL in structure but with this change: "${prompt}". Create a DALL-E 3 prompt in English that describes everything to remain exactly the same and the specific change. Respond ONLY with the prompt.`,
            },
            { type: 'image_url', image_url: { url: referenceImage.url } },
          ],
        }],
      });

      detailedPrompt = visionResponse.choices?.[0]?.message?.content || prompt;
    } catch (error) {
      console.error('Error generando prompt con visión:', error);
    }
  }

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt: detailedPrompt,
    n: 1,
    size: '1024x1024',
  });

  return response.data?.[0]?.url;
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const { engine, prompt, referenceImage } = JSON.parse(event.body || '{}');
    const imageUrl = engine === 'gemini'
      ? await generateWithGemini(prompt, referenceImage)
      : await generateWithDalle(prompt, referenceImage);

    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ imageUrl }) };
  } catch (error) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: error.message || 'Error interno del servidor' }),
    };
  }
}
