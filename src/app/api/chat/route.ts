import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { pinecone, indexName } from '@/lib/pinecone';

// Vercel AI SDK Groq provider setup (using OpenAI compatibility)
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { messages, source } = await req.json();
    const latestMessage = messages[messages.length - 1].content;

    // 1. Kullanıcı sorusunu vektöre çevir (Embedding)
    const embeddingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.EMBEDDING_MODEL || 'gemini-embedding-2'}:embedContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${process.env.EMBEDDING_MODEL || 'gemini-embedding-2'}`,
        content: { parts: [{ text: latestMessage }] },
        outputDimensionality: 768
      })
    });
    
    const embedData = await embeddingResponse.json();
    const queryEmbedding = embedData.embedding?.values;

    let contextText = '';

    if (queryEmbedding) {
      // 2. Vektör ile Pinecone üzerinde arama yap (Retrieval)
      const index = pinecone.index(indexName);
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 4,
        includeMetadata: true,
        filter: source && source !== 'all' ? { source: { $eq: source } } : undefined,
      });

      // 3. Gelen bağlamları (context) birleştir
      const contexts = queryResponse.matches.map(match => match.metadata?.text || '');
      contextText = contexts.join('\n\n---\n\n');
    }

    // 4. Prompt'u hazırla
    const systemPrompt = `
    Sen "ReactAtlas" isimli bir dokümantasyon asistanısın.
    Aşağıda sağlanan "Bağlam (Context)" bilgisini kullanarak kullanıcının sorusuna cevap ver. 
    Eğer cevap bağlamın içinde yoksa, "Bununla ilgili sağlanan dokümanlarda bir bilgi bulamadım" de.
    
    Bağlam:
    ${contextText}
    `;

    // 5. LLM ile cevap üret ve stream et
    const result = await streamText({
      model: groq(process.env.CHAT_MODEL || 'llama-3.1-8b-instant'),
      system: systemPrompt,
      messages,
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('API Chat Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
