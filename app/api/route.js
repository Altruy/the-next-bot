// route.js

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(request) {
  const API_KEY = process.env.OPENAI_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'API key missing' }), { status: 500 });
  }

  try {
    const { prompt, model } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid prompt' }), { status: 400 });
    }

    const allowedModels = ['gpt-4', 'gpt-4o-mini', 'o1'];
    if (!model || !allowedModels.includes(model)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing model selection' }), { status: 400 });
    }

    const systemPrompt = `
      You are a friendly and helpful chatbot.
      Please respond to the user in a human-like manner using well-structured pure HTML.
      Do NOT use Markdown, code fences, or any other types of formatting.
      Ensure that the HTML is valid, properly structured, and does not contain any additional wrapping or code fences.
    `;

    const combinedPrompt = `${systemPrompt}\n\nUser: ${prompt}\nChatbot:`;

    const { text } = await generateText({
      model: openai(model, {
        openai_api_key: API_KEY,
      }),
      prompt: combinedPrompt,
      max_tokens: 500, 
      temperature: 0.7, 
    });

    const stripCodeFences = (text) => {
      return text.replace(/```html\s*([\s\S]*?)\s*```/g, '$1').replace(/```\s*([\s\S]*?)\s*```/g, '$1').trim();
    };

    const cleanedText = stripCodeFences(text);

    return new Response(JSON.stringify({ text: cleanedText }), { status: 200 });
  } catch (error) {
    console.error('Error generating text:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
