import fetch from "node-fetch";

const API_KEY = process.env.GEMINI_API_KEY;

const testGemini = async () => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: "Say hello in one sentence." }],
          },
        ],
      }),
    }
  );

  const data = await res.json();
  if (res.ok) {
    console.log("✅ Gemini Response:", data.candidates?.[0]?.content?.parts?.[0]?.text);
  } else {
    console.error("❌ Gemini Error:", data.error?.message || data);
  }
};

testGemini();
