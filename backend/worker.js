const MODES = {
  basic: { model: "gpt-6-luna", reasoning: "low", instructions: "You are BEAU NEXUS, the everyday assistant in the BEAU (Behavioral & Executive Assistance Utility) system. Be warm, clear, efficient, and practical. Answer general questions, explain concepts, help organize plans, and keep responses appropriately concise." },
  deep: { model: "gpt-6.2-astra", reasoning: "high", instructions: "You are BEAU OMEGA, BEAU's deep-reasoning specialist. Work carefully through complex questions, compare alternatives, identify assumptions and edge cases, and give structured conclusions. Do not reveal private chain-of-thought; provide concise reasoning summaries and conclusions." },
  code: { model: "gpt-6.2-sol", reasoning: "medium", instructions: "You are BEAU FORGE, BEAU's software engineering specialist. Help design, write, debug, review, and explain code. Prefer correct, maintainable solutions, state assumptions, include complete code when useful, and consider security, tests, and edge cases." }
};
function headers(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(x => x.trim()).filter(Boolean);
  return { "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "null", "Vary": "Origin", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Content-Type": "application/json" };
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const h = headers(origin, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers: h });
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(x => x.trim()).filter(Boolean);
    if (!allowed.includes(origin)) return Response.json({ error: "Origin not allowed." }, { status: 403, headers: h });
    if (!env.OPENAI_API_KEY) return Response.json({ error: "The AI service is not configured yet." }, { status: 503, headers: h });
    try {
      const body = await request.json();
      const mode = MODES[body.mode];
      if (!mode) return Response.json({ error: "Unknown BEAU model." }, { status: 400, headers: h });
      if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 20) return Response.json({ error: "Send between 1 and 20 messages." }, { status: 400, headers: h });
      const messages = body.messages.map(m => {
        if (!m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || m.content.length > 12000) throw new Error("Invalid message format.");
        return { role: m.role, content: m.content };
      });
      if (messages[messages.length - 1].role !== "user") return Response.json({ error: "The latest message must be from the user." }, { status: 400, headers: h });
      const upstream = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Authorization": "Bearer " + env.OPENAI_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ model: mode.model, instructions: mode.instructions, input: messages, reasoning: { effort: mode.reasoning }, max_output_tokens: 3000 })
      });
      const data = await upstream.json();
      if (!upstream.ok) return Response.json({ error: data.error?.message || "The AI provider returned an error." }, { status: upstream.status >= 500 ? 502 : upstream.status, headers: h });
      const reply = (data.output || []).flatMap(item => item.content || []).filter(part => part.type === "output_text").map(part => part.text).join("\n").trim();
      if (!reply) return Response.json({ error: "The model returned an empty response. Please try again." }, { status: 502, headers: h });
      return Response.json({ reply, model: mode.model, beauModel: body.mode }, { headers: h });
    } catch (error) {
      return Response.json({ error: error.message || "Unexpected server error." }, { status: 400, headers: h });
    }
  }
};
