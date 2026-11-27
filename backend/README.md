# BEAU AI Worker

This is the private server-side AI gateway for the BEAU GitHub Pages interface. The browser never receives the OpenAI API key.

## Configure and deploy

1. In Cloudflare, create a Worker named `beau-ai` and paste in `worker.js` (or deploy this folder with Wrangler).
2. Add a Worker secret named `OPENAI_API_KEY` containing your OpenAI API key. Never put it in this repository or website code.
3. Add a Worker variable named `ALLOWED_ORIGINS` with this exact website origin: `https://jacksonloomis-commits.github.io` (no trailing slash).
4. Deploy. Cloudflare will provide a URL similar to `https://beau-ai.<your-account>.workers.dev`.
5. In the root `index.html`, replace `https://YOUR-BEAU-API.workers.dev/chat` in `BEAU_API_URL` with your Worker URL. Commit the change.

## BEAU model routing

- BEAU NEXUS (Basic) → `gpt-6-luna`, low reasoning
- BEAU OMEGA (Deep Thinking) → `gpt-6.2-astra`, high reasoning
- BEAU FORGE (Code) → `gpt-6.2-sol`, medium reasoning

The Worker uses the OpenAI Responses API. API access is billed separately from a ChatGPT subscription and requires an API account with billing enabled.

## Security limits

- API key is read only from the Cloudflare Worker secret `OPENAI_API_KEY`.
- Browser origin is restricted to `ALLOWED_ORIGINS`.
- Conversation history is limited to 20 messages, each up to 12,000 characters.
- Generated output is capped at 3,000 tokens.
- GitHub Pages is static hosting and cannot execute this Worker; the Worker must be deployed separately.
