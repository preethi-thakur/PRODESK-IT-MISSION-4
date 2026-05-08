# AI Cover Letter Generator

A vanilla HTML, CSS, and JavaScript web application that generates professional and personalized cover letters using the Groq AI API. Users can enter their details, job role, company name, skills, and job description to instantly create ATS-friendly cover letters.

A lightweight Node.js server securely handles API requests and keeps the Groq API key hidden from the browser.

## Stack

* Frontend: Plain HTML, CSS, and JavaScript (No frameworks)
* Backend: Node.js server with dotenv for environment variables
* AI Integration: Groq AI API
* PDF Download: jsPDF via CDN

## Quick Start

```bash
npm install
cp .env.example .env
npm start
```

Edit `.env` and set your `GROQ_API_KEY`.

Open the URL shown in terminal:
`http://localhost:3001`

Get your API key from:
https://console.groq.com/keys

## Environment Variables

| Name         | Required | Default         | Notes             |
| ------------ | -------- | --------------- | ----------------- |
| GROQ_API_KEY | Yes      | —               | Your Groq API key |
| GROQ_MODEL   | No       | llama3-70b-8192 | Groq model name   |
| PORT         | No       | 3001            | Local server port |

## Project Files

* `index.html` → User Interface
* `styles.css` → Styling
* `app.js` → Frontend Logic
* `server.js` → Backend API handler
* `.env.example` → Environment variable template

## Features

* AI-powered cover letter generation
* ATS-friendly output
* Responsive modern UI
* Copy to clipboard
* Download as PDF
* Secure API key handling
* Loading animations
