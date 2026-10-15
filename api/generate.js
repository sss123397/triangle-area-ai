export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { level } = req.body;
  if (![1, 2, 3, 4].includes(level)) {
    return res.status(400).json({ error: 'Invalid level' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
  }

  const systemPrompt = buildPrompt(level);

  try {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', err);
      return res.status(500).json({ error: 'AI request failed', details: err });
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'Empty AI response', raw: json });
    }

    const content = JSON.parse(text);

    if (typeof content.numeric_answer === 'undefined') {
      content.numeric_answer = extractNumber(content.final_answer);
    }

    return res.status(200).json(content);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'AI generation failed' });
  }
}

function extractNumber(str) {
  if (!str) return NaN;
  const m = String(str).match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
}

function buildPrompt(level) {
  const base = `You are a math problem generator for differentiated learning.
Topic: area of a triangle. Three methods:
  1) S = ½ · a · h (base and height)
  2) Heron's formula: S = √(p(p−a)(p−b)(p−c)), where p is the semi-perimeter
  3) Vertex coordinates: S = ½ · |x₁(y₂−y₃) + x₂(y₃−y₁) + x₃(y₁−y₂)|

IMPORTANT: numbers must yield a "clean" integer or simple answer.
Double-check your calculations before returning the JSON.

LANGUAGE: Write all text fields ("problem", "hints", "solution_steps", "final_answer", "unit", "side_labels") in ENGLISH.

Return ONLY valid JSON without markdown:
{
  "level": ${level},
  "problem": "problem text",
  "formula_reminder": "formula" or null,
  "hints": ["...", "..."],
  "solution_steps": ["...", "..."],
  "final_answer": "number with units (e.g., '30 cm²')",
  "numeric_answer": 30,
  "unit": "cm²",
  "visual": {
    "points": [{"x": 0, "y": 0}, {"x": 10, "y": 0}, {"x": 3, "y": 6}],
    "height_line": {"from": {"x": 3, "y": 6}, "to": {"x": 3, "y": 0}},
    "side_labels": [
      {"from": {"x": 0, "y": 0}, "to": {"x": 10, "y": 0}, "label": "a = 10"},
      {"from": {"x": 3, "y": 6}, "to": {"x": 3, "y": 0}, "label": "h = 6"}
    ]
  }
}

ABOUT visual.points: these are the actual triangle vertex coordinates in a convenient system (e.g., centimeters). They must match the problem statement.
Include height_line ONLY if the problem explicitly involves a height.
side_labels are labels drawn next to the triangle's sides.`;

  const byLevel = {
    1: `LEVEL 1 (Foundation, method ½·a·h):
- Simple whole numbers: a from 4 to 12, h from 2 to 8
- Include the formula S = ½ · a · h directly in the problem statement
- Provide 3 sequential hints
- Neutral context (just a triangle, no story)
- Triangle should be acute or right so the height falls inside`,

    2: `LEVEL 2 (Standard, method ½·a·h):
- Numbers from 6 to 24, may be even/odd
- Do NOT remind the formula in the problem statement
- 1–2 hints
- Light context: flag, sail, roof, sign
- Numbers chosen so the answer is a whole number`,

    3: `LEVEL 3 (Advanced, Heron's formula):
- Given three sides a, b, c (e.g., 13, 14, 15 — classic, or 6, 8, 10)
- Do NOT mention Heron's formula in the statement — the student must choose the method
- 2 hints: "semi-perimeter", "check whether the triangle exists"
- Real-world context: land plot, piece of fabric, field
- In solution_steps show computation of the semi-perimeter and the square root`,

    4: `LEVEL 4 (Expert, vertex coordinates):
- Given three vertices A(x₁,y₁), B(x₂,y₂), C(x₃,y₃) with integer coordinates
- Ask to find the area
- 1 hint: remind about the coordinate-area formula
- Full solution with substitution
- In visual.points use exactly these coordinates
- Answer should be integer or half-integer (e.g., 12 or 12.5)`,
  };

  return base + '\n\n' + byLevel[level];
}
