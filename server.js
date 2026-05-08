require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();

// Config
const PORT = Number(process.env.PORT) || 3001;

// Groq Client
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

// Middleware
app.use(cors());

app.use(express.json({
  limit: '64kb'
}));

// Serve Frontend
app.use(express.static(path.join(__dirname)));

// Health Route
app.get('/health', (req, res) => {

  res.json({
    success: true,
    message: 'Groq AI Cover Letter Server Running'
  });

});

// System Prompt
const SYSTEM_PROMPT = `
You are an expert career writer.

Write concise ATS-friendly professional cover letters.

Requirements:
- 250-350 words
- Professional tone
- Human sounding
- Personalized
- No markdown
- No bullet points
- Strong opening and closing
`;

// Build Prompt
function buildUserPrompt(form) {

  const lines = [

    `Full Name: ${form.fullName || 'Not provided'}`,

    `Role: ${form.role || 'Not provided'}`,

    `Company: ${form.company || 'Not provided'}`,

    `Experience: ${form.experience || 'Not provided'}`,

    `Skills: ${form.skills || 'Not provided'}`,

    `Achievements: ${form.achievements || 'Not provided'}`,

    `Motivation: ${form.motivation || 'Not provided'}`,

    `Tone: ${form.tone || 'Professional'}`
  ];

  if (
    form.jobDescription &&
    form.jobDescription.trim()
  ) {

    lines.push(
      '',
      'Job Description:',
      form.jobDescription.trim()
    );
  }

  lines.push(
    '',
    'Write the cover letter now.'
  );

  return lines.join('\n');
}

// Generate Route
app.post('/api/generate', async (req, res) => {

  try {

    // API Key Check
    if (!process.env.GROQ_API_KEY) {

      return res.status(500).json({
        success: false,
        error: 'Missing GROQ_API_KEY in .env'
      });
    }

    const form = req.body || {};

    // Validation
    if (
      !form.fullName ||
      !form.role ||
      !form.company
    ) {

      return res.status(400).json({
        success: false,
        error:
          'Required fields: fullName, role, company'
      });
    }

    // Build Prompt
    const userPrompt =
      buildUserPrompt(form);

    // Groq API Call
    const completion =
      await client.chat.completions.create({

        model: 'llama-3.3-70b-versatile',

        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],

        temperature: 0.7,

        max_tokens: 700
      });

    // Extract Response
    const coverLetter =
      completion
        ?.choices?.[0]
        ?.message?.content
        ?.trim();

    // Empty Response
    if (!coverLetter) {

      return res.status(500).json({
        success: false,
        error:
          'Groq returned empty response.'
      });
    }

    // Success
    return res.json({
      success: true,

      coverLetter,

      wordCount:
        coverLetter.split(/\s+/).length
    });

  } catch (err) {

    console.error(
      'Groq Error:',
      err
    );

    // Rate Limit
    if (err.status === 429) {

      return res.status(429).json({
        success: false,
        error:
          'Groq rate limit exceeded. Retry shortly.'
      });
    }

    // Invalid API Key
    if (
      err.message &&
      err.message.includes('Incorrect API key')
    ) {

      return res.status(401).json({
        success: false,
        error:
          'Invalid Groq API key.'
      });
    }

    // Generic Error
    return res.status(500).json({
      success: false,
      error:
        'Failed to generate cover letter.'
    });
  }
});

// 404 Route
app.use('*', (req, res) => {

  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });

});

// Start Server
app.listen(PORT, () => {

  console.log(
    `🚀 Groq Server running at http://localhost:${PORT}`
  );

  console.log(
    `🩺 Health Route: http://localhost:${PORT}/health`
  );

  if (!process.env.GROQ_API_KEY) {

    console.warn(
      '⚠️ Missing GROQ_API_KEY in .env'
    );
  }
});