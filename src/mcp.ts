// src/mcp.ts
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// 型をきれいにやりたいなら Env を cf-typegen で出してジェネリクスを付ければいいが、
// サンプルとしては敢えてシンプルにしている。
export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "gemini-3-pro-image",
    version: "0.0.1"
  });

  async init() {
    // 画像生成ツール
    this.server.tool(
      "gemini_generate_image",
      "Generate an image using Gemini 3 Pro Image (gemini-3-pro-image-preview).",
      {
        prompt: z
          .string()
          .min(1)
          .describe("Prompt text for the image to generate."),
        aspectRatio: z
          .enum([
            "1:1",
            "2:3",
            "3:2",
            "3:4",
            "4:3",
            "4:5",
            "5:4",
            "9:16",
            "16:9",
            "21:9"
          ])
          .optional()
          .describe("Aspect ratio. Default is model's standard (e.g. 1:1)."),
        imageSize: z
          .enum(["1K", "2K", "4K"])
          .optional()
          .describe("Resolution. Default is 1K.")
      },
      async ({ prompt, aspectRatio, imageSize }) => {
        // McpAgent から env を取る。型を気にしないなら any キャストで十分。
        const apiKey = (this as any).env?.GEMINI_API_KEY as
          | string
          | undefined;

        if (!apiKey) {
          return {
            content: [
              {
                type: "text",
                text: "GEMINI_API_KEY is not set in the environment."
              }
            ]
          };
        }

        // Gemini 3 Pro Image REST API リクエストボディ
        // https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent :contentReference[oaicite:1]{index=1}
        const body: any = {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        };

        const generationConfig: any = {
          responseModalities: ["IMAGE"]
        };

        const imageConfig: any = {};
        if (aspectRatio) {
          imageConfig.aspectRatio = aspectRatio;
        }
        if (imageSize) {
          imageConfig.imageSize = imageSize;
        }
        if (Object.keys(imageConfig).length > 0) {
          generationConfig.imageConfig = imageConfig;
        }
        if (Object.keys(generationConfig).length > 0) {
          body.generationConfig = generationConfig;
        }

        const resp = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
            },
            body: JSON.stringify(body)
          }
        );

        if (!resp.ok) {
          const errorText = await resp.text().catch(() => "");
          return {
            content: [
              {
                type: "text",
                text: `Gemini API error: ${resp.status} ${resp.statusText}${
                  errorText ? `\n${errorText}` : ""
                }`
              }
            ]
          };
        }

        const json: any = await resp.json();

        const candidates = json.candidates ?? [];
        if (!candidates.length) {
          return {
            content: [
              {
                type: "text",
                text: "Gemini API response has no candidates."
              }
            ]
          };
        }

        const parts = candidates[0].content?.parts ?? [];

        const textPart = parts.find((p: any) => typeof p.text === "string");
        const imagePart = parts.find(
          (p: any) =>
            p.inlineData && typeof p.inlineData.data === "string"
        );

        // 画像が返ってこなかった場合はテキストだけ返す
        if (!imagePart) {
          const fallbackText =
            textPart?.text ??
            "Gemini API response did not contain an image (inlineData).";
          return {
            content: [
              {
                type: "text",
                text: fallbackText
              }
            ]
          };
        }

        // inlineData.data はすでに base64 エンコード済み
        const imageData: string = imagePart.inlineData.data;
        const mimeType: string =
          imagePart.inlineData.mimeType ?? "image/png";

        const content: any[] = [];

        if (textPart?.text) {
          content.push({
            type: "text",
            text: textPart.text
          });
        }

        content.push({
          type: "image",
          data: imageData, // base64
          mimeType
        });

        return { content };
      }
    );
  }
}
