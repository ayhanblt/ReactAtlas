"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect, ChangeEvent, ClipboardEvent } from "react";
import { useI18n } from "@/contexts/I18nContext";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Inline SVGs for Phase 3
const ReactLogo = ({ className }: { className?: string }) => (
  <svg viewBox="-11.5 -10.23174 23 20.46348" className={className} fill="currentColor">
    <circle cx="0" cy="0" r="2.05" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);

const ReactNativeLogo = ({ className }: { className?: string }) => (
  <svg viewBox="-11.5 -10.23174 23 20.46348" className={className} fill="currentColor">
    <circle cx="0" cy="0" r="2.05" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);

const NextJsLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 180 180" className={className} fill="none">
    <circle cx="90" cy="90" r="90" fill="white" />
    <path fill="black" d="M141.4,129.5L78.6,47.4h-17v85.2h15.2V68.9l51.5,67.7C132.8,134.4,137.3,132.1,141.4,129.5z M125,47.4h-14v85.2h14V47.4z" />
  </svg>
);

const TailwindLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 60" className={className} fill="currentColor">
    <path d="M50 0C33.3 0 25 8.3 25 25C25 41.7 33.3 50 50 50C66.7 50 75 41.7 75 25C75 8.3 66.7 0 50 0ZM33.3 16.7C41.7 16.7 45.8 20.8 45.8 29.2C45.8 37.5 41.7 41.7 33.3 41.7C25 41.7 20.8 37.5 20.8 29.2C20.8 20.8 25 16.7 33.3 16.7ZM83.3 16.7C91.7 16.7 95.8 20.8 95.8 29.2C95.8 37.5 91.7 41.7 83.3 41.7C75 41.7 70.8 37.5 70.8 29.2C70.8 20.8 75 16.7 83.3 16.7Z" />
  </svg>
);

const sources = [
  { id: "all", labelKey: "all", icon: "grid_view", logo: null },
  { id: "react", labelKey: "react_docs", icon: null, logo: ReactLogo, color: "text-[#61DAFB]" },
  { id: "react_native", labelKey: "react_native", icon: null, logo: ReactNativeLogo, color: "text-[#61DAFB]" },
  { id: "nextjs", labelKey: "nextjs", icon: null, logo: NextJsLogo, color: "text-white" },
  { id: "tailwind", labelKey: "tailwind_css", icon: null, logo: TailwindLogo, color: "text-[#38B2AC]" },
] as const;

type ChatSession = {
  id: string;
  title: string;
  date: string;
};

export default function Home() {
  const { t, language, setLanguage } = useI18n();
  const [source, setSource] = useState("all");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<null | { title: string; content: string; url: string }>(null);

  // Attachments State
  const [attachments, setAttachments] = useState<{ id: string; url: string; file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat History State
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const savedSessionRef = useRef<string | null>(null);
  const allSources = useRef<any[]>([]);

  useEffect(() => {
    setSessionId(Date.now().toString());
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading, data, setMessages, setInput } = useChat({
    api: "/api/chat",
    body: {
      source,
    }
  });

  // Gather all sources for the session
  useEffect(() => {
    if (data && Array.isArray(data)) {
      const newSources = data.flatMap((d: any) => d?.sources || []);
      let updated = false;
      newSources.forEach(ns => {
        if (!allSources.current.some(s => s.url === ns.url)) {
          allSources.current.push(ns);
          updated = true;
        }
      });
      if (updated && sessionId) {
        localStorage.setItem(`chat_sources_${sessionId}`, JSON.stringify(allSources.current));
      }
    }
  }, [data, sessionId]);

  // Track chat history accurately
  useEffect(() => {
    if (messages.length > 0 && sessionId) {
      localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
      
      if (savedSessionRef.current !== sessionId) {
        const firstUserMessage = messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          savedSessionRef.current = sessionId;
          setHistory(prev => {
            if (prev.some(h => h.id === sessionId)) return prev; // Already saved
            
            const newSession = {
              id: sessionId,
              title: firstUserMessage.content.slice(0, 30) + '...',
              date: new Date().toLocaleDateString()
            };
            const updatedHistory = [newSession, ...prev].slice(0, 10);
            localStorage.setItem('chat_history', JSON.stringify(updatedHistory));
            return updatedHistory;
          });
        }
      }
    }
  }, [messages, sessionId]);

  const loadSession = (id: string) => {
    const savedMessages = localStorage.getItem(`chat_messages_${id}`);
    const savedSources = localStorage.getItem(`chat_sources_${id}`);
    if (savedMessages) {
      setSessionId(id);
      savedSessionRef.current = id;
      setMessages(JSON.parse(savedMessages));
      allSources.current = savedSources ? JSON.parse(savedSources) : [];
      setActiveDoc(null);
    }
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  const handleNewChat = () => {
    setMessages([]);
    setActiveDoc(null);
    setAttachments([]);
    setInput("");
    setSessionId(Date.now().toString());
    allSources.current = [];
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToAttachments(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      addFilesToAttachments(Array.from(e.clipboardData.files));
    }
  };

  const addFilesToAttachments = (files: File[]) => {
    const newAttachments = files.filter(f => f.type.startsWith('image/')).map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      file
    }));
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 4)); // max 4 images
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const target = prev.find(a => a.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter(a => a.id !== id);
    });
  };

  return (
    <div className="h-screen flex flex-col font-body-md text-body-md bg-[#0B0E14] text-[#e1e2eb] overflow-hidden">

      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-lg py-sm bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 h-16">
        <div className="flex items-center gap-md">
          <img src="/logo.svg" alt="ReactAtlas Logo" className="w-8 h-8" />
          <span className="font-headline-md text-headline-md font-bold text-primary">{t('app_name')}</span>
          <div className="hidden md:flex items-center gap-lg ml-xl">
            <a className="text-on-surface-variant font-body-md text-body-md hover:text-primary transition-colors duration-200" href="#">{t('models')}</a>
            <a className="text-on-surface-variant font-body-md text-body-md hover:text-primary transition-colors duration-200" href="#">{t('datasets')}</a>
            <a className="text-on-surface-variant font-body-md text-body-md hover:text-primary transition-colors duration-200" href="#">{t('team')}</a>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="relative hidden sm:block">
            <input
              className="bg-surface-container-high border-none rounded-lg py-xs px-md text-body-md focus:ring-1 focus:ring-primary w-64 text-on-surface placeholder-on-surface-variant/50"
              placeholder={t('search_docs')}
              type="text"
            />
          </div>
          <button
            className="md:hidden text-on-surface-variant hover:text-primary"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </nav>

      <div className="flex flex-1 pt-16 h-full overflow-hidden relative">

        {/* SideNavBar */}
        <aside className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex absolute md:static left-0 top-0 h-[calc(100vh-64px)] w-[280px] flex-col p-sm z-40 bg-surface-container-low/95 backdrop-blur-xl border-r border-outline-variant/30 transition-transform`}>
          <button
            onClick={handleNewChat}
            className="w-full bg-primary text-on-primary py-sm px-md rounded-lg font-bold flex items-center justify-center gap-sm mb-lg active:scale-[0.97] transition-transform text-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {t('new_chat')}
          </button>

          <nav className="flex-1 flex flex-col gap-xs overflow-y-auto custom-scrollbar text-sm">
            <div className="px-sm py-xs mb-xs">
              <span className="font-label-caps text-[10px] text-on-surface-variant/50">{t('knowledge_bases')}</span>
            </div>
            {sources.map((s) => (
              <button
                key={s.id}
                onClick={() => setSource(s.id)}
                className={`flex items-center gap-sm px-sm py-xs rounded-lg transition-colors duration-150 text-left ${source === s.id
                    ? "bg-secondary-container text-on-secondary-container font-bold active:scale-[0.97]"
                    : "text-on-surface-variant hover:bg-surface-variant/50"
                  }`}
              >
                {s.logo ? (
                  <s.logo className={`w-4 h-4 ${s.color}`} />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                )}
                <span>{t(s.labelKey as any)}</span>
              </button>
            ))}

            <div className="px-sm py-xs mt-md mb-xs">
              <span className="font-label-caps text-[10px] text-on-surface-variant/50">{t('recent_discussions')}</span>
            </div>
            {history.length === 0 ? (
              <div className="px-sm text-on-surface-variant/40 text-xs italic">Sohbet bulunmuyor</div>
            ) : (
              history.map(session => (
                <button key={session.id} onClick={() => loadSession(session.id)} className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-left text-xs truncate w-full">
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/50">chat_bubble</span>
                  <span className="truncate">{session.title}</span>
                </button>
              ))
            )}
          </nav>

          <div className="mt-auto flex flex-col gap-xs pt-md border-t border-outline-variant/20">
            <div className="flex items-center gap-md px-md py-sm text-on-surface-variant rounded-lg">
              <span className="material-symbols-outlined text-sm">language</span>
              <div className="flex gap-xs font-label-caps text-[10px]">
                <button
                  onClick={() => setLanguage('tr')}
                  className={`${language === 'tr' ? 'text-primary' : 'hover:text-primary transition-colors'}`}
                >TR</button>
                <span className="text-outline">|</span>
                <button
                  onClick={() => setLanguage('en')}
                  className={`${language === 'en' ? 'text-primary' : 'hover:text-primary transition-colors'}`}
                >EN</button>
              </div>
            </div>
            <a href="https://github.com/ayhanblt/ReactAtlas" target="_blank" rel="noreferrer" className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-colors duration-150 w-full text-left text-sm">
              <span className="material-symbols-outlined text-sm">menu_book</span>
              <span>{t('documentation')}</span>
            </a>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-row h-full overflow-hidden bg-surface-container-lowest relative z-10 w-full">

          {/* Subtle Animated Background */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] bg-tertiary/10 blur-[100px] rounded-full"></div>
          </div>

          {!hasMessages ? (
            /* Centered Landing Layout */
            <div className="flex-1 flex flex-col items-center justify-center px-container-padding max-w-[960px] mx-auto w-full relative z-10">
              <div className="text-center mb-xl">
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">{t('hero_title')}</h2>
                <p className="text-on-surface-variant max-w-md mx-auto">{t('hero_subtitle')}</p>
              </div>

              {/* Main Input Field */}
              <div className="w-full max-w-[720px] mb-lg">
                <form onSubmit={(e) => {
                  handleSubmit(e, { data: { attachments: attachments.map(a => a.file.name) } }); // Dummy payload to show intent
                  setAttachments([]); // clear attachments on submit
                }} className="chat-input-shadow bg-surface-container-high rounded-2xl p-xs transition-all duration-300">

                  {attachments.length > 0 && (
                    <div className="flex gap-sm p-sm border-b border-outline-variant/10 overflow-x-auto">
                      {attachments.map(att => (
                        <div key={att.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-outline-variant/20 shrink-0 group">
                          <img src={att.url} alt="attachment" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-[12px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-start gap-md p-md">
                    <span className="material-symbols-outlined text-primary mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    <textarea
                      className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface font-body-lg placeholder:text-on-surface-variant/40 resize-none outline-none"
                      placeholder={t('ask_placeholder')}
                      rows={2}
                      value={input}
                      onChange={handleInputChange}
                      onPaste={handlePaste}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                          e.currentTarget.form?.dispatchEvent(submitEvent);
                        }
                      }}
                    ></textarea>
                  </div>
                  <div className="flex items-center justify-between p-sm border-t border-outline-variant/10">
                    <div className="flex items-center gap-sm">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        multiple
                        accept="image/*"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-xs px-sm py-xs text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-xs transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">attach_file</span>
                        <span className="font-label-caps">{t('attach')}</span>
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || (!input.trim() && attachments.length === 0)}
                      className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Quick Selection Bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-md w-full max-w-[720px]">
                <button onClick={() => setSource('react')} className="group flex flex-col items-center gap-sm p-lg bg-surface-container/50 border border-outline-variant/20 rounded-xl hover:bg-surface-container hover:border-primary/50 transition-all">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1e2530] text-[#61DAFB] group-hover:scale-110 transition-transform">
                    <ReactLogo className="w-6 h-6" />
                  </div>
                  <span className="font-label-caps text-on-surface-variant">React</span>
                </button>
                <button onClick={() => setSource('nextjs')} className="group flex flex-col items-center gap-sm p-lg bg-surface-container/50 border border-outline-variant/20 rounded-xl hover:bg-surface-container hover:border-primary/50 transition-all">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1e2530] text-white group-hover:scale-110 transition-transform">
                    <NextJsLogo className="w-6 h-6" />
                  </div>
                  <span className="font-label-caps text-on-surface-variant">Next.js</span>
                </button>
                <button onClick={() => setSource('tailwind')} className="group flex flex-col items-center gap-sm p-lg bg-surface-container/50 border border-outline-variant/20 rounded-xl hover:bg-surface-container hover:border-primary/50 transition-all">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1e2530] text-[#38B2AC] group-hover:scale-110 transition-transform">
                    <TailwindLogo className="w-6 h-6" />
                  </div>
                  <span className="font-label-caps text-on-surface-variant">Tailwind</span>
                </button>
                <button onClick={() => setSource('react-native')} className="group flex flex-col items-center gap-sm p-lg bg-surface-container/50 border border-outline-variant/20 rounded-xl hover:bg-surface-container hover:border-primary/50 transition-all">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1e2530] text-[#61DAFB] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">smartphone</span>
                  </div>
                  <span className="font-label-caps text-on-surface-variant">{t('rn')}</span>
                </button>
              </div>

              {/* Footer Credit */}
              <footer className="mt-auto p-xl text-center z-10 w-full">
                <p className="font-code-sm text-xs text-on-surface-variant/30 uppercase tracking-[0.2em]">{t('system_status')}</p>
              </footer>
            </div>
          ) : (
            /* Split Screen Chat Interface */
            <>
              {/* Left Side: Chat Interface (100% or 55%) */}
              <section className={`w-full ${activeDoc ? 'lg:w-[55%]' : 'lg:w-[100%]'} flex flex-col border-r border-outline-variant/30 h-full transition-all duration-300 relative z-10`}>
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-lg custom-scrollbar space-y-xl pb-32">

                  {messages.map((m) => (
                    m.role === 'user' ? (
                      <div key={m.id} className="flex justify-end">
                        <div className="max-w-[85%] bg-surface-container-high text-on-surface p-md rounded-xl rounded-tr-none shadow-lg border-t border-white/5">
                          <p className="font-body-md whitespace-pre-wrap">{m.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className="flex flex-col gap-sm">
                        <div className="flex items-center gap-sm mb-xs">
                          <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                          <span className="font-label-caps text-outline uppercase">{t('rag_analysis_results')}</span>
                        </div>
                        <div className="bg-surface-container p-lg rounded-xl rounded-tl-none border-l-2 border-tertiary shadow-xl">
                          <div className="space-y-md">
                            <div className="font-body-md text-on-surface leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none prose-p:text-on-surface prose-a:bg-primary/20 prose-a:text-white prose-a:font-bold prose-a:px-1 prose-a:rounded prose-a:cursor-pointer prose-a:no-underline hover:prose-a:underline prose-pre:p-0 prose-pre:bg-transparent">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({node, className, children, ...props}: any) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    // SyntaxHighlighter wants a string as children
                                    return match ? (
                                      <SyntaxHighlighter
                                        style={vscDarkPlus as any}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-lg !my-4 !bg-[#1E1E1E]"
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    ) : (
                                      <code className="bg-primary/10 text-primary px-1 rounded" {...props}>
                                        {children}
                                      </code>
                                    )
                                  },
                                  a({node, href, children, ...props}: any) {
                                    return (
                                      <a 
                                        href={href} 
                                        {...props} 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const matchedSource = allSources.current.find((s: any) => s.url === href || s.title === children?.[0]);
                                          if (matchedSource) {
                                            setActiveDoc({ title: matchedSource.title, content: matchedSource.text, url: matchedSource.url });
                                          } else if (href) {
                                            window.open(href, '_blank');
                                          }
                                        }}
                                      >
                                        {children}
                                      </a>
                                    )
                                  }
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  ))}

                  {isLoading && (
                    <div className="flex flex-col gap-sm animate-pulse">
                      <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                        <span className="font-label-caps text-outline uppercase">Thinking...</span>
                      </div>
                      <div className="bg-surface-container p-lg rounded-xl rounded-tl-none border-l-2 border-tertiary shadow-xl w-32 h-16"></div>
                    </div>
                  )}
                </div>

                {/* Chat Input Area */}
                <div className="absolute bottom-0 left-0 w-full p-lg bg-surface-container-low/90 backdrop-blur-md border-t border-outline-variant/20">
                  <form onSubmit={(e) => {
                    handleSubmit(e, { data: { attachments: attachments.map(a => a.file.name) } });
                    setAttachments([]);
                  }} className="relative group flex flex-col bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-inner transition-all duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">

                    {attachments.length > 0 && (
                      <div className="flex gap-sm p-sm border-b border-outline-variant/10 overflow-x-auto">
                        {attachments.map(att => (
                          <div key={att.id} className="relative w-12 h-12 rounded-lg overflow-hidden border border-outline-variant/20 shrink-0 group/att">
                            <img src={att.url} alt="attachment" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeAttachment(att.id)}
                              className="absolute top-1 right-1 w-4 h-4 bg-black/50 hover:bg-black rounded-full flex items-center justify-center text-white opacity-0 group-hover/att:opacity-100 transition-opacity"
                            >
                              <span className="material-symbols-outlined text-[10px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex w-full relative">
                      <textarea
                        className="w-full bg-transparent py-md pl-lg pr-[100px] text-body-md border-none focus:ring-0 resize-none outline-none text-on-surface custom-scrollbar"
                        placeholder={t('follow_up_placeholder')}
                        rows={1}
                        value={input}
                        onChange={handleInputChange}
                        onPaste={handlePaste}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                            e.currentTarget.form?.dispatchEvent(submitEvent);
                          }
                        }}
                      ></textarea>
                      <div className="absolute right-md top-1/2 -translate-y-1/2 flex items-center gap-sm">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          multiple
                          accept="image/*"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-sm text-outline hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined">attach_file</span>
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || (!input.trim() && attachments.length === 0)}
                          className="p-sm bg-primary text-on-primary rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined">chat_bubble</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </section>

              {/* Right Side / Bottom Sheet: Documentation Panel (45%) */}
              {activeDoc && (
                <section className={`
                  fixed lg:static inset-x-0 bottom-0 z-50
                  w-full lg:w-[45%] h-[70vh] lg:h-full 
                  flex flex-col bg-surface-container-low 
                  border-t lg:border-t-0 border-l-0 lg:border-l border-outline-variant/30 
                  animate-in lg:slide-in-from-right slide-in-from-bottom duration-300
                  rounded-t-2xl lg:rounded-none shadow-2xl lg:shadow-none
                `}>
                  {/* Mobile drag handle indicator */}
                  <div className="w-12 h-1.5 bg-outline-variant/50 rounded-full mx-auto mt-2 mb-1 lg:hidden" />

                  <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant/30">
                    <div className="flex items-center gap-md">
                      <div className="w-8 h-8 flex items-center justify-center rounded bg-tertiary-container text-on-tertiary-container shrink-0">
                        <span className="material-symbols-outlined text-sm">auto_stories</span>
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-headline-sm text-sm font-bold text-on-surface truncate">{activeDoc.title}</h3>
                        <p className="text-[10px] text-outline font-label-caps uppercase break-all truncate">{activeDoc.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm shrink-0">
                      <a href={activeDoc.url} target="_blank" rel="noreferrer" className="p-xs text-outline hover:text-on-surface transition-colors flex"><span className="material-symbols-outlined">open_in_new</span></a>
                      <button onClick={() => setActiveDoc(null)} className="p-xs text-outline hover:text-on-surface transition-colors flex"><span className="material-symbols-outlined">close</span></button>
                    </div>
                  </div>
                  <div className="flex-1 w-full bg-white h-full relative overflow-hidden">
                    <iframe src={activeDoc.url} className="w-full h-full border-none absolute inset-0" title={activeDoc.title} sandbox="allow-same-origin allow-scripts allow-popups allow-forms" />
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
