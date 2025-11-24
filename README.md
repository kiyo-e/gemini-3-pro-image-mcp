# MCP Gemini 3 Pro Image Server

This is an MCP server running on Cloudflare Workers that uses Gemini 3.0 Pro to generate images.

## Setup

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Set Gemini API Key:**

    ```bash
    # For local development
    echo 'GEMINI_API_KEY="YOUR_KEY"' >> .dev.vars

    # For production
    npx wrangler secret put GEMINI_API_KEY
    ```

3.  **Run locally:**

    ```bash
    npm run dev
    ```

4.  **Deploy:**
    ```bash
    npm run deploy
    ```

## Usage

Configure your MCP client (e.g., Claude Desktop, Cursor) to connect to the deployed worker.

**Example Config:**

```jsonc
{
  "mcpServers": {
    "gemini-image": {
      "command": "npx",
      "args": ["mcp-remote", "https://<your-worker>.workers.dev/sse"],
    },
  },
}
```
