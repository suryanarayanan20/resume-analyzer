require("dotenv").config();

const PDFDocument = require("pdfkit");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const axios = require("axios");

const app = express();

// 🔥 IMPORTANT
app.use(cors());
app.use(express.json()); // for PDF download
app.use(express.static("public"));

// File upload
const upload = multer({ dest: "uploads/" });

// Test route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// 🔥 JSON EXTRACTOR
function extractJSON(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return null;
  } catch {
    return null;
  }
}

// 🔥 AI FUNCTION
async function analyzeResume(text, role) {
  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [
          {
            role: "user",
            content: `
You are an expert resume analyzer.

Analyze ONLY based on given resume content.

Compare resume with job role: ${role}

Return ONLY pure JSON:

{
  "score": number,
  "match_score": number,
  "ats_score": number,
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "missing_skills": [],
  "suggestions": []
}

Rules:
- Score based on skills, projects, experience, education
- Match score realistic (40–90)
- ATS score based on keywords, structure, relevance
- ATS score between 40–95
- NEVER give 0%
- Only include missing skills if clearly not present
- Avoid generic answers
- Give practical suggestions

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
        },
        timeout: 60000
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.log("HF ERROR:", error.response?.data || error.message);

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

// 🔥 UPLOAD ROUTE
app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    console.log("API HIT 🔥");

    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const role = req.body.role || "Software Developer";

    const buffer = fs.readFileSync(req.file.path);

    let data;
    try {
      data = await pdfParse(buffer);
    } catch (err) {
      return res.status(400).send("PDF not supported");
    }

    if (!data.text || data.text.trim() === "") {
      return res.status(400).send("No readable text");
    }

    const aiResult = await analyzeResume(data.text, role);

    const parsed = extractJSON(aiResult);

    if (parsed) {
      res.json(parsed);
    } else {
      console.log("JSON ERROR:", aiResult);
      res.status(500).send("Invalid AI response");
    }

  } catch (error) {
    console.log("FULL ERROR:", error);
    res.status(500).send("Something went wrong");
  }
});

// 🔥 PDF DOWNLOAD ROUTE
app.post("/download", (req, res) => {
  try {
    console.log("DOWNLOAD HIT 🔥");

    const data = req.body;

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=resume-analysis.pdf");

    doc.pipe(res);

    // TITLE
    doc.fontSize(20).text("Resume Analysis Report", { align: "center" });
    doc.moveDown();

    // SCORES
    doc.fontSize(14).text(`Score: ${data.score}`);
    doc.text(`Match Score: ${data.match_score}%`);
    doc.text(`ATS Score: ${data.ats_score || 0}%`);
    doc.moveDown();

    // SUMMARY
    doc.text("Summary:");
    doc.text(data.summary || "N/A");
    doc.moveDown();

    // STRENGTHS
    doc.text("Strengths:");
    (data.strengths || []).forEach(s => doc.text("- " + s));
    doc.moveDown();

    // WEAKNESSES
    doc.text("Weaknesses:");
    (data.weaknesses || []).forEach(w => doc.text("- " + w));
    doc.moveDown();

    // MISSING SKILLS
    doc.text("Missing Skills:");
    (data.missing_skills || []).forEach(m => doc.text("- " + m));
    doc.moveDown();

    // SUGGESTIONS
    doc.text("Suggestions:");
    (data.suggestions || []).forEach(s => doc.text("- " + s));

    doc.end();

  } catch (err) {
    console.log("PDF ERROR:", err);
    res.status(500).send("PDF Error");
  }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});