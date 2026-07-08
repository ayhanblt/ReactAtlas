import 'dotenv/config';
import { pinecone, indexName } from '../src/lib/pinecone';
import { GoogleGenAI } from '@google/genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as cheerio from 'cheerio';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// RAG için taranacak örnek dokümantasyon sayfaları
const docs = [
  {
    source: 'react',
    url: 'https://react.dev/learn',
  },
  {
    source: 'nextjs',
    url: 'https://nextjs.org/docs',
  },
  {
    source: 'tailwind',
    url: 'https://tailwindcss.com/docs/installation',
  },
  {
    source: 'react-native',
    url: 'https://reactnative.dev/docs/getting-started',
  }
];

async function scrapePage(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  // Ana içerik alanını (article veya main tag'i) çek, gereksizleri sil
  $('nav, header, footer, script, style').remove();
  const text = $('article').text() || $('main').text() || $('body').text();
  return text.replace(/\s+/g, ' ').trim();
}

async function ingest() {
  console.log('Ingestion started...');
  const index = pinecone.index(indexName);
  
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  for (const doc of docs) {
    console.log(`Scraping ${doc.source} from ${doc.url}...`);
    const content = await scrapePage(doc.url);
    
    console.log(`Splitting ${doc.source}...`);
    const chunks = await textSplitter.splitText(content);
    
    console.log(`Embedding ${chunks.length} chunks for ${doc.source}...`);
    
    const records = [];
    for (let i = 0; i < chunks.length; i++) {
      // Generate embedding using Gemini
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: chunks[i],
        config: { outputDimensionality: 768 }
      });
      
      const embedding = response.embeddings?.[0]?.values;
      if (!embedding) continue;
      
      records.push({
        id: `${doc.source}-${i}`,
        values: embedding,
        metadata: {
          source: doc.source,
          text: chunks[i],
          url: doc.url,
        }
      });
    }
    
    console.log(`Upserting to Pinecone for ${doc.source}... Records count: ${records.length}`);
    if (records.length > 0) {
      console.log('First record ID:', records[0].id, 'Values length:', records[0].values.length);
      // Chunk upserts if necessary, but for a few pages we can just send
      await index.upsert({ records });
    }
  }
  
  console.log('Ingestion completed successfully!');
}

ingest().catch(console.error);
