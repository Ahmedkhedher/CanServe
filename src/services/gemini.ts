import { Platform } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY as string | undefined;
const MODEL = (process.env.EXPO_PUBLIC_GEMINI_MODEL as string | undefined) || 'gemini-2.5-flash';

export type UserProfileInput = {
  cancerType: string;
  stage: string;
  age: string;
};

export async function fetchDietAndWellness(input: UserProfileInput): Promise<{ suggestions: string }> {
  if (!API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY. Set it in your environment.');
  }
  const makeEndpoint = (model: string) => {
    const version = model.startsWith('gemini-2.5') ? 'v1' : 'v1beta';
    return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;
  };
  let endpoint = makeEndpoint(MODEL);
  const prompt = `You are a clinical nutrition and wellness assistant. Provide general educational guidance (NOT medical advice). Be concise.
Context:
- Cancer type: ${input.cancerType || 'unknown'}
- Stage: ${input.stage || 'unknown'}
- Age: ${input.age || 'unknown'}
Output exactly 5 lines (no extra lines, no bullets):
Diet: <short text>
Hydration: <short text>
Activity: <short text>
Sleep: <short text>
Wellness score: <number>/100 - <very short reason>`;

  const buildBody = (p: string, maxTokens: number) => ({
    contents: [
      { role: 'user', parts: [{ text: p }] },
    ],
    generationConfig: {
      temperature: 0.3,
      topK: 1,
      topP: 0.1,
      maxOutputTokens: maxTokens,
      candidateCount: 1,
    },
  } as any);

  const callOnce = async (p: string, maxTokens: number) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildBody(p, maxTokens)),
    });
    if (!res.ok) {
      let msg = `Gemini API error ${res.status}`;
      try {
        const data = await res.json();
        msg += `: ${JSON.stringify(data)}`;
      } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    const cand = data?.candidates?.[0];
    const text = cand?.content?.parts?.map((q: any) => q?.text).join('') || '';
    try { console.log('[Gemini] finishReason:', cand?.finishReason, 'len:', (text || '').length); } catch {}
    return { data, cand, text: (text || '').trim() };
  };

  // 1st attempt (larger budget so it can finish)
  let { data, cand, text } = await callOnce(prompt, 512);
  if (!text) {
    const finishReason = cand?.finishReason || data?.promptFeedback?.blockReason;
    if (finishReason === 'MAX_TOKENS') {
      // 2nd attempt: ultra-brief prompt + decent tokens
      const tinyPrompt = `Context: cancer=${input.cancerType || 'unknown'}, stage=${input.stage || 'unknown'}, age=${input.age || 'unknown'}.
Reply in EXACTLY 5 lines, each <= 8 words:
Diet: <text>
Hydration: <text>
Activity: <text>
Sleep: <text>
Wellness score: <number>/100 - <very short reason>`;
      const retry = await callOnce(tinyPrompt, 192);
      data = retry.data; cand = retry.cand; text = retry.text;

      // 3rd attempt: micro prompt + tiny tokens
      if (!text || (cand?.finishReason || data?.promptFeedback?.blockReason) === 'MAX_TOKENS') {
        const microPrompt = `Context: c=${input.cancerType || 'unknown'}, s=${input.stage || 'unknown'}, a=${input.age || 'unknown'}.
Reply in 5 lines, 3-5 words each.
Diet: <text>
Hydration: <text>
Activity: <text>
Sleep: <text>
Wellness score: <n>/100 - <short reason>`;
        const retry2 = await callOnce(microPrompt, 96);
        data = retry2.data; cand = retry2.cand; text = retry2.text;
      }
    }
  } else {
    // If truncated but we got partial text, return it
    if ((cand?.finishReason || data?.promptFeedback?.blockReason) === 'MAX_TOKENS') {
      return { suggestions: text };
    }
  }
  if (!text) {
    const finishReason = cand?.finishReason || data?.promptFeedback?.blockReason;
    const safety = cand?.safetyRatings || data?.promptFeedback?.safetyRatings;
    // Try to extract any JSON-like content from parts
    const raw = cand?.content?.parts?.find((p: any) => typeof p?.text === 'string')?.text;
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        const suggestions = `Diet: ${obj.diet}\nHydration: ${obj.hydration}\nActivity: ${obj.activity}\nSleep: ${obj.sleep}\nWellness score: ${obj.wellness}`;
        return { suggestions };
      } catch {}
    }
    throw new Error(`Model returned no text${finishReason ? ` (finishReason: ${finishReason})` : ''}${safety ? `; safety: ${JSON.stringify(safety)}` : ''}`);
  }
  // If we got text, try to parse JSON first; otherwise use raw text
  try {
    const obj = JSON.parse(text);
    const suggestions = `Diet: ${obj.diet}\nHydration: ${obj.hydration}\nActivity: ${obj.activity}\nSleep: ${obj.sleep}\nWellness score: ${obj.wellness}`;
    return { suggestions };
  } catch {}
  return { suggestions: text };
}

export type NutritionResult = {
  calories: number;
  recommended: 'yes' | 'no';
};

export async function analyzeIngredientsNutrition(params: { cancerType?: string; stage?: string; age?: string; ingredients: string }): Promise<NutritionResult> {
  if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY. Set it in your environment.');
  const makeEndpoint = (model: string) => {
    const version = model.startsWith('gemini-2.5') ? 'v1' : 'v1beta';
    return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;
  };
  const endpoint = makeEndpoint(MODEL);
  const prompt = `You are a clinical nutrition assistant.
Rules:
- Educational only, not medical advice.
- OUTPUT ONLY COMPACT JSON, no prose, no markdown.
- JSON SHAPE: {"calories":<integer>,"recommended":"recommended|not_recommended"}
Task: Given the cancer context and the ingredient list with rough amounts, return that JSON only.`;

  const body: any = {
    contents: [
      { role: 'user', parts: [{ text: `${prompt}\nContext: cancer=${params.cancerType || 'unknown'}, stage=${params.stage || 'unknown'}, age=${params.age || 'unknown'}\nIngredients: ${params.ingredients}` }] },
    ],
    generationConfig: { temperature: 0.0, topK: 1, topP: 0.1, maxOutputTokens: 64, candidateCount: 1 },
  };

  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    let msg = `Gemini API error ${res.status}`;
    try { const d = await res.json(); msg += `: ${JSON.stringify(d)}`; } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join('')?.trim() || '';
  try {
    const j = JSON.parse(text);
    const c = Number(j.calories);
    const verdict = (j.recommended || '').toString().toLowerCase();
    return { calories: Number.isFinite(c) ? Math.max(0, Math.round(c)) : 0, recommended: verdict === 'recommended' ? 'yes' : 'no' };
  } catch {
    // Try a JSON conversion pass
    try {
      const convertBody: any = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Convert the following answer into STRICT JSON with keys: calories (integer), recommended (recommended|not_recommended). Output ONLY JSON.' },
              { text },
            ],
          },
        ],
        generationConfig: { temperature: 0.0, maxOutputTokens: 96, candidateCount: 1 },
      };
      const res2 = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(convertBody) });
      if (res2.ok) {
        const d2 = await res2.json();
        const t2 = d2?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join('')?.trim() || '';
        const j2 = JSON.parse(t2);
        const c2 = Number(j2.calories);
        const v2 = (j2.recommended || '').toString().toLowerCase();
        return { calories: Number.isFinite(c2) ? Math.max(0, Math.round(c2)) : 0, recommended: v2 === 'recommended' ? 'yes' : 'no' };
      }
    } catch {}

    // Gemini-only mode: if still not parseable, surface an error
    throw new Error('Model did not return parseable JSON for calories and recommendation. Please try rephrasing ingredients with amounts, e.g., "100g grilled chicken, 1 cup cooked rice"');
  }
}

// ===== Image analysis API =====
export type FoodAnalysis = {
  recommended: 'yes' | 'no';
};

const arrayBufferToBase64 = (buf: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  // eslint-disable-next-line no-undef
  return typeof btoa !== 'undefined' ? btoa(binary) : (global as any).Buffer?.from(binary, 'binary')?.toString('base64');
};

export async function analyzeFoodImage(params: { cancerType?: string; stage?: string; age?: string; imageUri: string }): Promise<FoodAnalysis> {
  if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY. Set it in your environment.');
  const makeEndpoint = (model: string) => {
    const version = model.startsWith('gemini-2.5') ? 'v1' : 'v1beta';
    return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;
  };
  const endpoint = makeEndpoint(MODEL);
  const prompt = `You are a clinical nutrition assistant.
Rules:
- Educational only, not medical advice.
- OUTPUT ONLY COMPACT JSON, no prose, no markdown.
- JSON SHAPE: {"recommended":"recommended|not_recommended"}
Task: Based on the cancer context and the photo, return that JSON only.`;

  const resp = await fetch(params.imageUri);
  const mime = resp.headers.get('Content-Type') || 'image/jpeg';
  const ab = await resp.arrayBuffer();
  const b64 = arrayBufferToBase64(ab);

  const body: any = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${prompt}\nContext: cancer=${params.cancerType || 'unknown'}, stage=${params.stage || 'unknown'}, age=${params.age || 'unknown'}` },
          { inlineData: { mimeType: mime, data: b64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.0, topK: 1, topP: 0.1, maxOutputTokens: 64, candidateCount: 1 },
  };

  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    let msg = `Gemini API error ${res.status}`;
    try { const d = await res.json(); msg += `: ${JSON.stringify(d)}`; } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join('')?.trim() || '';
  try {
    const j = JSON.parse(text);
    const verdict = (j.recommended || '').toString().toLowerCase();
    const mapped: FoodAnalysis = { recommended: verdict === 'recommended' ? 'yes' : 'no' };
    return mapped;
  } catch {
    // Attempt a JSON conversion pass with the model
    try {
      const convertBody: any = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Convert the following answer into STRICT JSON with key: recommended (one of recommended|not_recommended). Output ONLY JSON, no extra text.' },
              { text },
            ],
          },
        ],
        generationConfig: { temperature: 0.0, maxOutputTokens: 128, candidateCount: 1 },
      };
      const res2 = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(convertBody) });
      if (res2.ok) {
        const d2 = await res2.json();
        const t2 = d2?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join('')?.trim() || '';
        const j2 = JSON.parse(t2);
        const verdict = (j2.recommended || '').toString().toLowerCase();
        return { recommended: verdict === 'recommended' ? 'yes' : 'no' };
      }
    } catch {}

    // Heuristic fallback parser
    const lower = (text || '').toLowerCase();
    let rec: 'yes' | 'no' = 'no';
    if (/(not\s+recommended|avoid|contraindicated|should\s+not|bad)/.test(lower)) rec = 'no';
    else if (/(recommended|safe|okay|suitable|good)/.test(lower)) rec = 'yes';
    return { recommended: rec };
  }
}
