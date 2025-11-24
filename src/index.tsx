// src/index.tsx
import { Hono } from "hono";
import { renderer } from "./renderer";
import { MyMCP } from "./mcp";

export { MyMCP }; // Durable Object としてエクスポート（wrangler.jsonc の class_name と合わせる）

const app = new Hono();

app.use(renderer);

// MCP: SSE / HTTP エンドポイント
// /sse は従来型 SSE Transport, /mcp は Streamable HTTP Transport
app.mount("/sse", MyMCP.serveSSE("/sse").fetch, {
  replaceRequest: false
});
app.mount("/mcp", MyMCP.serve("/mcp").fetch, {
  replaceRequest: false
});

// 適当なトップページ（デバッグ用）
app.get("/", (c) => {
  return c.render(<h1>MCP Gemini 3 Pro Image Server</h1>);
});

export default app;
