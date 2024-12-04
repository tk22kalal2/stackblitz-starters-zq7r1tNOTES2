import { API_KEYS, API_ENDPOINTS } from '../config/constants.js';

export async function callVisionAPI(imageContent) {
  const response = await fetch(`${API_ENDPOINTS.VISION}?key=${API_KEYS.VISION_API}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{ 
        image: { content: imageContent }, 
        features: [{ type: "TEXT_DETECTION" }] 
      }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Vision API error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function callGeminiAPI(text) {
  const prompt = {
    contents: [{
      parts: [{
        text: `You are an expert assistant that structures and simplifies content into notes.

Instructions:
- Use proper HTML formatting for structure
- Include headings with <h1>, <h2>, <h3> tags
- Use bullet points with <ul> and <li> tags
- Add spacing between sections
- Organize content hierarchically
- Highlight key concepts in <strong> tags
- Use <br> tags for line breaks

Content to summarize and create notes for:

${text}`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };

  const response = await fetch(`${API_ENDPOINTS.GEMINI}?key=${API_KEYS.GEMINI_API}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prompt)
  });
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }
  
  return formatGeminiResponse(data.candidates[0].content.parts[0].text);
}

function formatGeminiResponse(text) {
  // Convert markdown-style formatting to HTML
  return text
    // Ensure consistent spacing
    .replace(/\n\n/g, '<br><br>')
    // Format headings if not already in HTML
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    // Format bullet points if not already in HTML
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    // Wrap bullet points in ul tags if not already wrapped
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Format bold text if not already in HTML
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Add spacing between sections
    .replace(/<\/h[123]>/g, '$&<br>')
    .replace(/<\/ul>/g, '$&<br>')
    // Clean up any double spaces or extra line breaks
    .replace(/(<br>){3,}/g, '<br><br>')
    .trim();
}