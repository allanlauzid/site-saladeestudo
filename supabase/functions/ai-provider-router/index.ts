import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ProviderId = 'google' | 'openai' | 'anthropic' | 'openrouter' | 'groq' |
  'mistral' | 'xai' | 'deepseek' | 'together' | 'perplexity' | 'fireworks' |
  'cohere' | 'huggingface' | 'custom' | 'unknown';

type ModelInfo = { id: string; label: string; type: 'texto' | 'imagem' };

const providers: Record<ProviderId, { name: string; baseUrl: string; protocol: string }> = {
  google: { name: 'Google AI', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', protocol: 'google' },
  openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', protocol: 'openai' },
  anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', protocol: 'anthropic' },
  openrouter: { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', protocol: 'openai' },
  groq: { name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', protocol: 'openai' },
  mistral: { name: 'Mistral AI', baseUrl: 'https://api.mistral.ai/v1', protocol: 'openai' },
  xai: { name: 'xAI', baseUrl: 'https://api.x.ai/v1', protocol: 'openai' },
  deepseek: { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', protocol: 'openai' },
  together: { name: 'Together AI', baseUrl: 'https://api.together.xyz/v1', protocol: 'openai' },
  perplexity: { name: 'Perplexity', baseUrl: 'https://api.perplexity.ai', protocol: 'openai' },
  fireworks: { name: 'Fireworks AI', baseUrl: 'https://api.fireworks.ai/inference/v1', protocol: 'openai' },
  cohere: { name: 'Cohere', baseUrl: 'https://api.cohere.com/v2', protocol: 'cohere' },
  huggingface: { name: 'Hugging Face', baseUrl: 'https://router.huggingface.co/v1', protocol: 'openai' },
  custom: { name: 'Compatível com OpenAI', baseUrl: '', protocol: 'openai' },
  unknown: { name: 'Provedor não identificado', baseUrl: '', protocol: 'unknown' },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function normalizeBaseUrl(value?: string | null) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function providerFromHost(baseUrl?: string | null): ProviderId | '' {
  if (!baseUrl) return '';
  try {
    const host = new URL(baseUrl).hostname.toLowerCase();
    if (host.includes('googleapis.com')) return 'google';
    if (host.includes('openai.com')) return 'openai';
    if (host.includes('anthropic.com')) return 'anthropic';
    if (host.includes('openrouter.ai')) return 'openrouter';
    if (host.includes('groq.com')) return 'groq';
    if (host.includes('mistral.ai')) return 'mistral';
    if (host.includes('x.ai')) return 'xai';
    if (host.includes('deepseek.com')) return 'deepseek';
    if (host.includes('together.xyz')) return 'together';
    if (host.includes('perplexity.ai')) return 'perplexity';
    if (host.includes('fireworks.ai')) return 'fireworks';
    if (host.includes('cohere.com')) return 'cohere';
    if (host.includes('huggingface.co')) return 'huggingface';
    return 'custom';
  } catch {
    return '';
  }
}

function detectProvider(key: string, baseUrl?: string | null): ProviderId {
  const hostProvider = providerFromHost(baseUrl);
  if (hostProvider) return hostProvider;
  if (/^AIza[\w-]{20,}$/i.test(key)) return 'google';
  if (/^sk-ant-/i.test(key)) return 'anthropic';
  if (/^sk-or-v1-/i.test(key)) return 'openrouter';
  if (/^gsk_/i.test(key)) return 'groq';
  if (/^xai-/i.test(key)) return 'xai';
  if (/^hf_/i.test(key)) return 'huggingface';
  if (/^co[_-]/i.test(key)) return 'cohere';
  if (/^sk-(proj-|svcacct-)?/i.test(key)) return 'openai';
  return 'unknown';
}

function modelType(id: string, methods: string[] = []): 'texto' | 'imagem' | 'outro' {
  const value = id.toLowerCase();
  const joined = methods.join(' ').toLowerCase();
  if (/image|imagen|dall-e|flux|recraft|stable.?diffusion|sdxl|ideogram/.test(value) || /predict|image/.test(joined)) return 'imagem';
  if (/embedding|moderation|rerank|whisper|transcri|speech|tts|audio|realtime|live/.test(value)) return 'outro';
  return 'texto';
}

function normalizeModels(items: any[]): ModelInfo[] {
  const map = new Map<string, ModelInfo>();
  for (const item of items || []) {
    const raw = typeof item === 'string' ? item : item.id || item.name || item.model || '';
    const id = String(raw).replace(/^models\//, '').trim();
    if (!id) continue;
    const type = item.type || modelType(id, item.supportedGenerationMethods || item.methods || []);
    if (type === 'outro') continue;
    map.set(id, { id, label: item.displayName || item.label || id, type });
  }
  return [...map.values()].sort((a, b) => a.type.localeCompare(b.type) || a.label.localeCompare(b.label, 'pt-BR'));
}

async function requestJson(url: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw { status: 0, category: 'network', message: 'Não foi possível alcançar o provedor.' };
  }
  let data: any = null;
  try { data = await response.json(); } catch { /* resposta sem JSON */ }
  if (!response.ok) {
    const message = data?.error?.message || data?.error?.type || data?.message || `Erro HTTP ${response.status}`;
    throw { status: response.status, message };
  }
  return data || {};
}

async function listModels(apiKey: string, provider: ProviderId, baseUrl: string): Promise<ModelInfo[]> {
  if (provider === 'unknown' || !baseUrl) throw { status: 400, message: 'Provedor ou endpoint não identificado.' };
  if (provider === 'google') {
    const data = await requestJson(`${baseUrl}/models?pageSize=1000`, { headers: { 'x-goog-api-key': apiKey } });
    return normalizeModels(data.models || []);
  }
  if (provider === 'anthropic') {
    const data = await requestJson(`${baseUrl}/models?limit=1000`, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } });
    return normalizeModels(data.data || []);
  }
  if (provider === 'cohere') {
    const data = await requestJson(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
    return normalizeModels(data.models || data.data || []);
  }
  const data = await requestJson(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
  return normalizeModels(data.data || data.models || []);
}

async function generate(apiKey: string, provider: ProviderId, baseUrl: string, type: 'texto' | 'imagem', model: string, prompt: string) {
  if (provider === 'google') {
    const body: any = { contents: [{ parts: [{ text: prompt }] }] };
    if (type === 'imagem') body.generationConfig = { responseModalities: ['IMAGE', 'TEXT'] };
    const data = await requestJson(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(body),
    });
    const parts = data?.candidates?.[0]?.content?.parts || [];
    if (type === 'imagem') {
      const image = parts.find((part: any) => part.inlineData);
      if (!image) throw { status: 400, message: 'A API não retornou uma imagem.' };
      return `data:${image.inlineData.mimeType};base64,${image.inlineData.data}`;
    }
    const text = parts.map((part: any) => part.text || '').join('\n').trim();
    if (!text) throw { status: 400, message: 'A API não retornou texto.' };
    return text;
  }
  if (provider === 'anthropic') {
    if (type === 'imagem') throw { status: 404, message: 'Modelo de imagem indisponível neste adaptador.' };
    const data = await requestJson(`${baseUrl}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
    });
    return (data.content || []).map((part: any) => part.text || '').join('\n').trim();
  }
  if (provider === 'cohere') {
    if (type === 'imagem') throw { status: 404, message: 'Modelo de imagem indisponível neste adaptador.' };
    const data = await requestJson(`${baseUrl}/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
    });
    return data?.message?.content?.map((part: any) => part.text || '').join('\n').trim() || data.text || '';
  }
  if (type === 'imagem') {
    const data = await requestJson(`${baseUrl}/images/generations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, prompt, response_format: 'b64_json' }),
    });
    const image = data?.data?.[0];
    if (image?.b64_json) return `data:image/png;base64,${image.b64_json}`;
    if (image?.url) return image.url;
    throw { status: 400, message: 'A API não retornou uma imagem.' };
  }
  const data = await requestJson(`${baseUrl}/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
  });
  return data?.choices?.[0]?.message?.content || '';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, error: 'Método não permitido.' }, 405);

  try {
    const body = await request.json();
    const keyId = String(body.keyId || '');
    if (!keyId) return json({ ok: false, error: 'keyId é obrigatório.' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: keyRow, error } = await admin.from('gemini_api_keys').select('*').eq('id', keyId).maybeSingle();
    if (error || !keyRow) return json({ ok: false, error: 'API Key não encontrada.' }, 404);

    const apiKey = String(keyRow.api_key || '');
    const provider = (body.provider || keyRow.provider || detectProvider(apiKey, body.baseUrl || keyRow.base_url)) as ProviderId;
    const baseUrl = normalizeBaseUrl(body.baseUrl || keyRow.base_url || providers[provider]?.baseUrl);

    if (body.action === 'listModels') {
      const models = await listModels(apiKey, provider, baseUrl);
      const checkedAt = new Date().toISOString();
      await admin.from('gemini_api_keys').update({ provider, base_url: baseUrl || null, models_cache: models, models_checked_at: checkedAt }).eq('id', keyId);
      return json({ ok: true, provider, providerName: providers[provider]?.name, models, checkedAt });
    }
    if (body.action === 'generate') {
      const type = body.type === 'imagem' ? 'imagem' : 'texto';
      const model = String(body.model || '');
      const prompt = String(body.prompt || '');
      if (!model || !prompt) return json({ ok: false, error: 'Modelo e prompt são obrigatórios.' }, 400);
      const result = await generate(apiKey, provider, baseUrl, type, model, prompt);
      return json({ ok: true, provider, providerName: providers[provider]?.name, model, type, result });
    }
    return json({ ok: false, error: 'Ação desconhecida.' }, 400);
  } catch (error: any) {
    const status = Number(error?.status) || 500;
    return json({ ok: false, error: String(error?.message || 'Falha ao acessar o provedor.'), category: error?.category || null }, status);
  }
});
