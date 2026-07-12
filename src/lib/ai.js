/**
 * SpaceXAI / xAI helper (OpenAI-compatible chat completions).
 * Requires XAI_API_KEY in env.
 */

const XAI_BASE = 'https://api.x.ai/v1';
const DEFAULT_MODEL = process.env.XAI_MODEL || 'grok-4.5';

export async function xaiChat({ system, user, temperature = 0.7 }) {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
        throw new Error('XAI_API_KEY is not configured');
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
            messages: [
                ...(system ? [{ role: 'system', content: system }] : []),
                { role: 'user', content: user },
            ],
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
        // try extract fenced JSON
        const match = text.match(/\{[\s\S]*\}/);
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
