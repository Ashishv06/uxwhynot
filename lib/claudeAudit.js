// Sends the captured screenshot + scan data to Claude and gets back structured
// findings. Uses a forced tool call so the response is guaranteed valid JSON
// matching AUDIT_JSON_SCHEMA — no parsing prose out of a chat reply.

const Anthropic = require("@anthropic-ai/sdk");
const { METHODOLOGY_PROMPT } = require("./methodologyPrompt");
const { AUDIT_JSON_SCHEMA } = require("./auditSchema");

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

async function runClaudeAudit(captured) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key."
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const scanSummary =
    captured.axeViolations.length === 0
      ? captured.axeError
        ? `Automated accessibility scan did not complete (${captured.axeError}). Rely on the screenshot for accessibility findings and mark them "Simulated" or "Unable to verify" accordingly.`
        : "Automated accessibility scan found zero violations."
      : `Automated accessibility scan (axe-core) found ${captured.axeViolations.length} violation type(s):\n` +
        captured.axeViolations
          .map(
            (v) =>
              `- [${v.impact || "unknown"}] ${v.id}: ${v.help} (${v.nodeCount} element(s) affected${
                v.sampleTargets.length ? `, e.g. ${v.sampleTargets.join(", ")}` : ""
              })`
          )
          .join("\n");

  const competitors = captured.competitors || [];

  const content = [
    {
      type: "text",
      text:
        `Audit this page.\n\nURL: ${captured.url}\nPage title: ${captured.title}\n\n` +
        `${scanSummary}\n\nThe screenshot is attached.` +
        (competitors.length
          ? `\n\n${competitors.length} competitor screenshot(s) follow, for the benchmarking section only — do not use them for the main audit above.`
          : ""),
    },
    {
      type: "image",
      source: { type: "base64", media_type: "image/png", data: captured.screenshotBase64 },
    },
  ];

  for (const competitor of competitors) {
    if (competitor.error) {
      content.push({
        type: "text",
        text: `Competitor: ${competitor.url}\nScreenshot capture failed (${competitor.error}). Exclude this competitor rather than guessing.`,
      });
      continue;
    }
    content.push({
      type: "text",
      text: `Competitor: ${competitor.title || competitor.url} (${competitor.url})`,
    });
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: competitor.screenshotBase64 },
    });
  }

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: competitors.length ? 8192 : 4096,
      system: METHODOLOGY_PROMPT,
      tools: [
        {
          name: "submit_audit",
          description: "Submit the completed UX audit as structured data.",
          input_schema: AUDIT_JSON_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "submit_audit" },
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    // The SDK's err.message is the raw "<status> <json body>" string — pull
    // out just the human-readable part the API actually sent, if present.
    throw new Error(err.error?.error?.message || err.message);
  }

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse) {
    throw new Error("Claude did not return a structured audit. Try again.");
  }

  return toolUse.input;
}

module.exports = { runClaudeAudit };
