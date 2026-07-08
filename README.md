<div align="center">
  <img src="public/logo.svg" alt="ReactAtlas Logo" width="120" />
  <h1>ReactAtlas</h1>
  <p>An open-source RAG engine for React, React Native, Next.js & Tailwind CSS documentation.</p>
</div>

---

ReactAtlas is an intelligent chat assistant that reads directly from the official documentations of the modern web stack. By leveraging Pinecone for vector retrieval and Groq/Gemini for generation, ReactAtlas grounds its answers in real documentation, eliminating hallucinations.

## Design
This project uses the **Synthetic Logic** design system, an IDE-like interface tailored for high-density information display and RAG source citations via a dual-pane layout.

## Setup

1. Rename `.env.example` to `.env` and fill in your keys (Groq, Gemini, Pinecone).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the ingest script to populate your vector database:
   ```bash
   npm run ingest
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
