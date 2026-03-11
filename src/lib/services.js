import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

async function fetchJson(url, payload, signal) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `La solicitud falló (${response.status})`);
  }

  return data;
}

export const auth = {
  signIn: async (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signUp: async (email, password) => supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: email.split('@')[0],
      },
    },
  }),
  signOut: async () => supabase.auth.signOut(),
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};

export async function generateImage(prompt, referenceImage = null, engine = 'dalle', options = {}) {
  const data = await fetchJson('/.netlify/functions/ai-image', {
    prompt,
    referenceImage,
    engine,
  }, options.signal);

  return data.imageUrl;
}

export async function processWithAI(modelProvider, messages, attachment = null, options = {}) {
  const data = await fetchJson('/.netlify/functions/ai-chat', {
    modelProvider,
    messages,
    attachment,
  }, options.signal);

  const content = data.content || '';

  return {
    async *[Symbol.asyncIterator]() {
      yield { choices: [{ delta: { content } }] };
    },
  };
}
