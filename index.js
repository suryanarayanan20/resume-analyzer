require("dotenv").config();

const Tesseract = require("tesseract.js");
const mammoth = require("mammoth"); 
const PDFDocument = require("pdfkit");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// JSON extractor
function extractJSON(text) {
  try {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");

    if (first !== -1 && last !== -1) {
      const jsonString = text.substring(first, last + 1);
      return JSON.parse(jsonString);
    }
  } catch (err) {
    console.log("JSON PARSE ERROR:", err.message);
  }
  return null;
}

// Resume check
function isResume(text) {
  const keywords = [
    "education",
    "experience",
    "skills",
    "projects",
    "resume",
    "objective",
    "summary"
  ];

  let count = 0;

  keywords.forEach(word => {
    if (text.toLowerCase().includes(word)) count++;
  });

  return count >= 2;
}

// 🔥 UPDATED AI FUNCTION (ROLE BASED STRICT)
async function analyzeResume(text, role) {
  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model:"meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [
          {
            role: "user",
           content: `
You are a STRICT ATS resume evaluator.

Job Role: ${role}

Analyze the resume ONLY for this role.

SCORING RULES:
- Not relevant → 30–50
- Partial → 50–70
- Strong → 70–90
- Be strict

Also provide:

1. recommended_keywords → important missing keywords for this role
2. improvement_tips → how to improve resume quality
3. role_specific_advice → what candidate should do to get this role

Return ONLY JSON:

{
  "score": number,
  "match_score": number,
  "ats_score": number,
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "missing_skills": [],
  "recommended_keywords": [],
  "improvement_tips": [],
  "role_specific_advice": [],
  "suggestions": []
}

Rules:
- Keywords must be relevant to role: ${role}
- Tips must be practical (not generic)
- Advice must help get job
- Be strict and realistic

Resume:
${text}
`
          }
        ],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.log("AI ERROR:", error.message);

    return JSON.stringify({
      score: 0,
      match_score: 0,
      ats_score: 0,
      summary: "AI Error",
      strengths: [],
      weaknesses: [],
      missing_skills: [],
      suggestions: ["Try again"]
    });
  }
}

// 🔥 UPLOAD ROUTE (ALL FILE SUPPORT)
app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    const role = req.body.role || "Software Developer";
    const buffer = fs.readFileSync(req.file.path);

    let text = "";

    // PDF
    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(buffer);
      text = data.text;
    }

    // DOCX
    else if (req.file.mimetype.includes("wordprocessingml")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    // TXT
    else if (req.file.mimetype === "text/plain") {
      text = buffer.toString();
    }

    // IMAGE (OCR)
    else if (req.file.mimetype.startsWith("image/")) {
      const result = await Tesseract.recognize(buffer, "eng");
      text = result.data.text;
    }

    // OTHER
    else {
      return res.json({
        error: "Unsupported file type. Upload PDF, DOCX, TXT or Image"
      });
    }

    if (!text || text.trim() === "") {
      return res.json({ error: "No readable content found" });
    }

    if (!isResume(text)) {
      return res.json({
        error: "This is not a resume. Please upload a valid resume."
      });
    }

    const aiResult = await analyzeResume(text, role);
    console.log("AI RAW RESPONSE:\n", aiResult); 
    const parsed = extractJSON(aiResult);

    if (parsed) {
  res.json(parsed);
} else {
  console.log("PARSE FAILED ❌");

  res.json({
    error: "AI response invalid. Try again."
  });
}
  } catch (error) {
    console.log("SERVER ERROR:", error);
    res.status(500).send("Server error");
  }
});

// PDF download
app.post("/download", (req, res) => {
  const data = req.body;
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=resume-analysis.pdf");

  doc.pipe(res);

  doc.fontSize(20).text("Resume Analysis Report", { align: "center" });
  doc.moveDown();

  doc.text(`Score: ${data.score}`);
  doc.text(`Match Score: ${data.match_score}%`);
  doc.text(`ATS Score: ${data.ats_score}%`);

  doc.moveDown();
  doc.text("Summary:");
  doc.text(data.summary);

  doc.moveDown();
  doc.text("Suggestions:");
  data.suggestions.forEach(s => doc.text("- " + s));

  doc.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));