# ReactAtlas

ReactAtlas is an open-source RAG (Retrieval-Augmented Generation) engine tailored specifically for front-end documentation (React, React Native, Next.js, and Tailwind CSS).

## Design System: Synthetic Logic
The project follows the "Synthetic Logic" design system.
- **Vibe:** Technical, efficient, dark-mode first (Obsidian), Glassmorphism.
- **Colors:**
  - Background: `#0B0E14` (surface-container-lowest)
  - Primary: `#C0C1FF` (Indigo)
  - Secondary: `#7BD0FF` (Teal)
  - Tertiary: `#5CD5F6` (Blue)
- **Typography:**
  - `Inter` for UI, Headings, and standard chat bubbles.
  - `JetBrains Mono` for Code blocks, Labels, and RAG citations.
- **Layout:** Fixed 280px left sidebar. Main chat view uses a 55% / 45% split-screen layout when viewing RAG documentation alongside chat responses.

## Core Technology
- Framework: Next.js 14+ (App Router)
- AI SDK: Vercel AI SDK (`ai@3.2.14`)
- Models: Groq (`llama-3.1-8b-instant`) for Chat, Google (`gemini-embedding-2`) for vector embeddings.
- Vector DB: Pinecone
- Styling: Tailwind CSS
- Internationalization (i18n): Simple React Context implementation (TR/EN).
