// src/index.tsx
import { Hono } from "hono";
import { createMcpHandler } from "agents/mcp";
import { renderer } from "./renderer";
import { createMcpServer } from "./mcp";

const app = new Hono();

app.use(renderer);

app.use("*", async (c, next) => {
  console.log(`[Request] ${c.req.method} ${c.req.url}`);
  await next();
});

// MCP streamable HTTP endpoint (stateless)
app.all("/mcp", async (c) => {
  const handler = createMcpHandler(createMcpServer(c.env), { route: "/mcp" });
  return handler(c.req.raw, c.env, c.executionCtx);
});

// Simple landing page (debug)
app.get("/", (c) => c.render(<h1>MCP Gemini 3 Pro Image Server</h1>));

export default app;
