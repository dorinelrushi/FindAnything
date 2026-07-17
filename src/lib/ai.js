/**
 * SpaceXAI / xAI helper (OpenAI-compatible chat completions).
 * Requires XAI_API_KEY in env.
 */

const XAI_BASE = 'https://api.x.ai/v1';
const DEFAULT_MODEL = process.env.XAI_MODEL || 'grok-4.5';

/**
 * @param {{ system?: string, user?: string, messages?: Array<{role:string, content:string}>, temperature?: number, maxTokens?: number }} opts
 */
export async function xaiChat({ system, user, messages, temperature = 0.7, maxTokens = 2500 }) {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
        throw new Error('XAI_API_KEY is not configured');
    }

    let finalMessages;
    if (Array.isArray(messages) && messages.length > 0) {
        finalMessages = [
            ...(system ? [{ role: 'system', content: system }] : []),
            ...messages.map((m) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: String(m.content || ''),
            })),
        ];
    } else {
        finalMessages = [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: user || '' },
        ];
    }

    const res = await fetch(`${XAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            temperature,
            max_tokens: maxTokens,
            messages: finalMessages,
        }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
}

export function safeParseJson(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        // try extract fenced JSON or first object
        const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const candidate = fenced ? fenced[1] : text;
        const match = candidate.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch {
                return null;
            }
        }
        return null;
    }
}
