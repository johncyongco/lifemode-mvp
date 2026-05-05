const BASE = import.meta.env.VITE_N8N_BASE_URL || "https://your-n8n-domain.com/webhook";

async function post(path: string, body: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await res.text();
    console.log(`n8n ${path} status:`, res.status, "body:", text.slice(0, 200));
    try {
      return JSON.parse(text);
    } catch {
      return { output: text };
    }
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`n8n ${path} fetch error:`, err);
    throw err;
  }
}

export async function startSession(payload: {
  intent: string;
  thought: string;
  mode: "quick" | "deep";
}) {
  return post("/start-session", payload);
}

export async function sendChatMessage(payload: {
  sessionId: string;
  userMessage: string;
  exchangeCount: number;
  mode: "quick" | "deep";
  conversationHistory?: { role: string; text: string }[];
}) {
  return post("/chat", {
    sessionId: payload.sessionId,
    userMessage: payload.userMessage,
    exchangeCount: payload.exchangeCount,
    mode: payload.mode,
    conversationHistory: JSON.stringify(payload.conversationHistory),
  });
}

export async function getClarity(payload: {
  sessionId: string;
  fullConversation: { role: string; text: string }[];
  mode: "quick" | "deep";
}) {
  return post("/clarity", {
    sessionId: payload.sessionId,
    mode: payload.mode,
    fullConversation: JSON.stringify(payload.fullConversation),
  });
}
