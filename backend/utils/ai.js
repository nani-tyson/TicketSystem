import { createAgent, gemini } from "@inngest/agent-kit";

const analyzeTicket = async (ticket) => {
  const supportAgent = createAgent({
    model: gemini({
      model: "gemini-1.5-flash-8b",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.2,
      maxTokens: 512,
    }),
    name: "AI Ticket Triage Assistant",
    system: `You are an expert AI assistant that processes technical support tickets.

Respond ONLY with raw JSON in this format:

{
  "summary": "Short summary of the issue",
  "priority": "low" | "medium" | "high",
  "helpfulNotes": "Useful explanation or resources",
  "relatedSkills": ["skill1", "skill2"]
}

Rules:
- DO NOT include \`\`\` or markdown.
- DO NOT add any explanation.
- Output must be strictly JSON.`,
  });

  const response = await supportAgent.run(`
Analyze the following support ticket and return ONLY a raw JSON object with:

{
  "summary": "Short summary of the issue",
  "priority": "low" | "medium" | "high",
  "helpfulNotes": "Useful explanation or resources",
  "relatedSkills": ["skill1", "skill2"]
}

Rules:
- DO NOT include \`\`\` or markdown.
- DO NOT explain anything.
- Output must be strictly valid JSON.

---

Ticket:

Title: ${ticket.title}
Description: ${ticket.description}
  `);

  console.log("🧠 Full AI Response:", response);

  const raw = response.output?.[0]?.content;

  if (!raw || typeof raw !== "string") {
    console.error("❌ Gemini response missing usable text output.");
    return null;
  }

  try {
    const parsed = JSON.parse(raw.trim());

    // Optional: Validate structure
    if (
      !parsed.summary ||
      !["low", "medium", "high"].includes(parsed.priority) ||
      !parsed.helpfulNotes ||
      !Array.isArray(parsed.relatedSkills)
    ) {
      console.error("❌ AI response has invalid structure:", parsed);
      return null;
    }

    return parsed;
  } catch (e) {
    console.error("❌ Failed to parse AI response:", e.message);
    return null;
  }
};

export default analyzeTicket;
