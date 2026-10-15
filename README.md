# 📐 AI Triangle Area — Differentiated Learning

An AI-powered web application that takes a **single core geometry task** — finding the area of a triangle — and dynamically adapts it into **four distinct difficulty levels** using a Large Language Model (Google Gemini).

This project demonstrates how Artificial Intelligence can personalize educational content to match diverse learner capabilities, providing tailored hints and step-by-step solutions for each level.

---

## 🌐 Live Demo

**🔗 https://triangle-area-ai.vercel.app**

---

## 🎯 Project Overview

The core objective of this application is **differentiated learning**: the same mathematical concept is presented at four levels of complexity, with the AI adjusting not only the numbers, but also the method, the context, and the amount of scaffolding provided.

| Level | Name | Method | Scaffolding | Context |
|-------|------|--------|-------------|---------|
| **L1** | Foundation | `S = ½ · a · h` | Formula given + 3 step-by-step hints | Neutral (just a triangle) |
| **L2** | Standard | `S = ½ · a · h` | No formula reminder, 1–2 hints | Light story (flag, sail, roof) |
| **L3** | Advanced | Heron's formula | Student must choose the method | Real-world (land plot, fabric) |
| **L4** | Expert | Vertex coordinates | Single hint + full derivation | Abstract geometry |

---

## ✨ Features

- **Four differentiated levels** — from simple plug-in to multi-step coordinate geometry
- **Dynamic AI task generation** — every task is generated fresh by Google Gemini
- **Interactive SVG visualization** — each triangle is drawn to scale with labeled vertices and height
- **Instant answer checking** — with a 1% tolerance for floating-point answers
- **Progressive hints** — hidden by default, revealed on demand
- **Full step-by-step solutions** — shown only when the student requests them
- **Task history** — the last 5 tasks are stored in the session
- **Responsive design** — works on desktop, tablet, and mobile

---

## 🧠 How Differentiation Is Achieved

Differentiation is implemented entirely through the **system prompt** in `api/generate.js`. The prompt instructs the model to vary four dimensions:

1. **Numbers** — from small integers (L1) to realistic values (L4)
2. **Mathematical method** — `½·a·h` → Heron's formula → coordinate formula
3. **Scaffolding** — 3 hints (L1) → 2 hints (L2) → 1 hint (L3) → 0 hints (L4)
4. **Context** — neutral → light story → real-world application

The response format is strict JSON, ensuring the front-end always receives a consistent structure:

```json
{
  "problem": "...",
  "formula_reminder": "..." | null,
  "hints": ["...", "..."],
  "solution_steps": ["...", "..."],
  "final_answer": "30 cm²",
  "numeric_answer": 30,
  "unit": "cm²",
  "visual": { ... }
}
