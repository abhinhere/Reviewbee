// ReviewBee AI Review Generation API Route

import { NextResponse } from 'next/server';
import { generateAIdraft } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { tone, length, language, rating, answers, questions } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback to local heuristic generator
      const reviewText = await generateAIdraft({
        tone,
        length,
        language,
        rating,
        answers,
        questions,
      });
      return NextResponse.json({ success: true, text: reviewText, provider: 'fallback-local' });
    }

    // Call real OpenAI API if key is present
    const prompt = `
      You are an AI assistant representing a customer writing an authentic, natural, human-like review for a local business.
      The review must be written in the first person ("I", "we") based ONLY on the customer's answers provided below.

      BUSINESS CONTEXT & SETTINGS:
      - Star Rating: ${rating} out of 5
      - Target Language: ${language} (Write the entire review in this language)
      - Writing Tone: ${tone} (e.g. friendly, professional, luxury, simple)
      - Review Length: ${length} (short: ~1-2 sentences, medium: ~3-4 sentences, long: ~5+ sentences)

      CUSTOMER ANSWERS (Format: Question Text -> Answer):
      ${questions
        .map((q: any) => {
          const ans = answers[q.id];
          if (!ans) return null;
          return `- "${q.question_text[language] || q.question_text['en']}": "${Array.isArray(ans) ? ans.join(', ') : ans}"`;
        })
        .filter(Boolean)
        .join('\n')}

      CRITICAL INSTRUCTIONS:
      1. Write ONLY the review text. Do NOT wrap it in quotes, do NOT add introductory or concluding remarks (like "Here is your review:").
      2. Keep it completely natural, human-like, and organic. Avoid corporate speak or sounding like an obvious AI-generated script.
      3. Do NOT make up exaggerated claims, fake names, or experiences that are not mentioned in the answers.
      4. Match the requested tone and length.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You draft authentic Google reviews for local businesses in first-person based on customer survey answers.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const reviewText = data.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({ success: true, text: reviewText, provider: 'openai' });
  } catch (err: any) {
    console.error('AI API Route Error:', err);
    // Return local heuristic draft on error so customer is never blocked
    try {
      const body = await request.clone().json();
      const reviewText = await generateAIdraft(body);
      return NextResponse.json({
        success: true,
        text: reviewText,
        provider: 'fallback-on-error',
        error: err.message,
      });
    } catch {
      return NextResponse.json({ error: 'Failed to generate review' }, { status: 500 });
    }
  }
}
