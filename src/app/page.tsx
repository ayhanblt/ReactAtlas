"use client";

import { useChat } from "ai/react";
import { useState } from "react";
import { Bot, Send, User } from "lucide-react";

const sources = [
  { id: "all", label: "Tümü" },
  { id: "react", label: "React" },
  { id: "nextjs", label: "Next.js" },
  { id: "react-native", label: "React Native" },
  { id: "tailwind", label: "Tailwind CSS" },
];

export default function Home() {
  const [source, setSource] = useState("all");
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      source,
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 shadow-xl rounded-2xl flex flex-col h-[90vh] overflow-hidden border border-zinc-200 dark:border-zinc-800">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">ReactAtlas Asistan</h1>
          </div>
          
          {/* Source Selection ButtonGroup */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg overflow-x-auto max-w-full">
            {sources.map((s) => (
              <button
                key={s.id}
                onClick={() => setSource(s.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  source === s.id 
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <Bot className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">Nasıl yardımcı olabilirim?</p>
              <p className="text-sm">Yukarıdan bir dokümantasyon seçerek soru sormaya başlayın.</p>
            </div>
          ) : (
            messages.map((m: any) => (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                
                <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-zinc-100 dark:bg-zinc-800 rounded-tl-sm'
                }`}>
                  <div className="prose dark:prose-invert prose-sm">
                    {m.content}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              placeholder={`${sources.find(s => s.id === source)?.label} dokümanlarında ara...`}
              onChange={handleInputChange}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
