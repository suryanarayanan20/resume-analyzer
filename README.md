# 🚀 AI Resume Analyzer

An AI-powered web application that analyzes resumes and provides intelligent insights such as resume score, job match percentage, ATS score, missing skills, and improvement suggestions.

---

## 📌 Features

* 📊 Resume Score (based on Skills, Projects, Experience, Education)
* 🎯 Job Role Matching
* 🧠 ATS Score (real-world inspired)
* 📉 Missing Skills Detection
* 💡 Smart Suggestions (practical improvements)
* 🧾 Resume Preview (PDF viewer)
* 📥 Download Report (PDF)

---

## 🛠️ Project Setup

### 1. Clone Repository

git clone https://github.com/YOUR_USERNAME/resume-analyzer.git
cd resume-analyzer

---

### 2. Install Dependencies

npm install

---

### 3. Setup Environment Variables

Create a `.env` file in root folder:

HF_API_KEY=your_huggingface_api_key

---

### 4. Run the Project

node index.js

App will run at:

http://localhost:3000

---

## 🏗️ Architecture

### 🔹 Frontend

* HTML, CSS, JavaScript
* Handles UI, file upload, preview, results display

### 🔹 Backend

* Node.js + Express
* Handles file upload, PDF parsing, API calls

### 🔹 AI Layer

* Hugging Face API
* Model: Meta LLaMA 3 (8B Instruct)

### 🔄 Flow

User → Upload Resume → Backend → Extract Text → AI → JSON → UI

---

## 🤖 AI Usage

This project uses Hugging Face Inference API with:

Model: meta-llama/Meta-Llama-3-8B-Instruct

Used for:

* Resume scoring
* Job role matching
* ATS scoring
* Skill gap analysis
* Suggestions generation

---

## 🧠 Prompt Used

You are an expert resume analyzer.

Analyze ONLY based on given resume content.
Do NOT assume anything extra.

Compare resume with job role.

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

* Score based on skills, projects, experience, education
* Match score realistic (40–90)
* ATS score based on keywords + structure
* NEVER give random results
* Only include missing skills if not present
* Avoid generic answers
* Give practical suggestions

---

## ⚠️ Limitations

* AI may sometimes return inconsistent results
* PDF parsing may fail for complex formats
* ATS score is simulated (not real recruiter system)
* Depends on external API (Hugging Face)
* No authentication / user accounts

---

## 🚀 Improvements (Future Scope)

* 🔐 User login system
* 📊 Resume history dashboard
* 🌍 Multiple resume comparison
* ⚡ Faster AI (caching / optimization)
* 📱 Mobile responsive UI improvements
* 🎯 Better ATS accuracy using datasets
* 🤖 Fine-tuned custom AI model

---

## 🌐 Live Demo

https://your-app.onrender.com

---

## 👨‍💻 Author

Surya Narayanan

---

## ⭐ Conclusion

This project demonstrates:

* Full-stack development
* AI integration
* Real-world problem solving
* Deployment using cloud platforms

---
