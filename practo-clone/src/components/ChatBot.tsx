"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Stethoscope, AlertTriangle, RotateCcw } from "lucide-react";
import { generateReply, getSuggestedPrompts, ChatAction } from "@/lib/chatbot-data";
import { useAuth } from "@/context/AuthContext";
import ChatOptions from "@/components/ChatOptions";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  actions?: ChatAction[];
  isEmergency?: boolean;
}

const LOGGED_OUT_WELCOME =
  "Welcome to Curo. You’re browsing as a guest, so I can help you find doctors, explore specialties, and understand how booking works. Sign in when you’re ready to book, manage appointments, or get help with your personal account. I can’t diagnose conditions or replace professional medical advice.";

function getWelcomeText(account: { role: "patient" | "doctor"; name: string } | null) {
  if (!account) return LOGGED_OUT_WELCOME;
  if (account.role === "doctor") {
    return `Welcome, ${account.name}. I’m your practice support assistant. I can help with availability, patient appointments, consultations, and your public profile.`;
  }
  return `Welcome, ${account.name}. I can help you find a doctor, book or manage appointments, and update your profile.`;
}

let idCounter = 0;
const ASSISTANT_RESPONSE_DELAY_MS = 420;

function nextId() {
  idCounter += 1;
  return `msg-${idCounter}-${Date.now()}`;
}

export default function ChatBot() {
  const { account } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "bot", text: LOGGED_OUT_WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const responseTimerRef = useRef<number | null>(null);
  const role = account?.role ?? null;
  const suggestedPrompts = getSuggestedPrompts(role);
  const supportLabel = role === "doctor" ? "Practice support" : role === "patient" ? "Patient support" : "Guest support";
  const inputPlaceholder = role === "doctor" ? "Ask about your practice…" : "Ask about doctors, bookings, or health…";

  // Keep the very first (welcome) message in sync with login state,
  // without touching the rest of the conversation.
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === "welcome" ? { ...m, text: getWelcomeText(account) } : m))
    );
  }, [account]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  useEffect(() => () => {
    if (responseTimerRef.current) window.clearTimeout(responseTimerRef.current);
  }, []);

  const resetConversation = useCallback(() => {
    if (responseTimerRef.current) window.clearTimeout(responseTimerRef.current);
    setMessages([{ id: "welcome", role: "bot", text: getWelcomeText(account) }]);
    setInput("");
    setIsTyping(false);
  }, [account]);

  const handleSend = useCallback((message = input) => {
    const trimmed = message.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = { id: nextId(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const replyRole = account?.role ?? null;
    responseTimerRef.current = window.setTimeout(() => {
      const reply = generateReply(trimmed, replyRole);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "bot",
          text: reply.text,
          actions: reply.actions,
          isEmergency: reply.isEmergency,
        },
      ]);
      setIsTyping(false);
    }, ASSISTANT_RESPONSE_DELAY_MS);
  }, [account?.role, input, isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        aria-controls="curo-assistant"
        className="fixed bottom-4 right-4 z-50 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-white shadow-lg transition-[transform,background-color] duration-150 ease-out hover:bg-primary-dark active:scale-[0.97] sm:bottom-5 sm:right-5"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        <span className="text-sm font-medium">{open ? "Close" : "Need help?"}</span>
      </button>

      {/* Chat panel */}
      {open && (
        <section
          id="curo-assistant"
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-title"
          className="fixed bottom-20 right-4 z-50 flex h-[min(580px,calc(100dvh-6rem))] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-xl sm:bottom-24 sm:right-5"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-line bg-primary-light px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-white">
              <Stethoscope size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p id="assistant-title" className="font-display text-sm font-semibold text-ink">Curo Assistant</p>
              <p className="text-xs text-muted">{supportLabel}</p>
            </div>
            <button
              type="button"
              onClick={resetConversation}
              aria-label="Start a new conversation"
              title="Start a new conversation"
              className="flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-[background-color,color,transform] duration-150 ease-out hover:bg-surface hover:text-ink active:scale-[0.97]"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-[background-color,color,transform] duration-150 ease-out hover:bg-surface hover:text-ink active:scale-[0.97]"
            >
              <X size={17} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} role="log" aria-live="polite" aria-label="Assistant messages" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-white"
                      : m.isEmergency
                      ? "border border-accent bg-accent-light text-ink"
                      : "bg-bg text-ink"
                  }`}
                >
                  {m.isEmergency && (
                    <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-accent">
                      <AlertTriangle size={13} />
                      Please seek help now
                    </div>
                  )}
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.actions.map((a) => (
                        <Link
                          key={a.href + a.label}
                          href={a.href}
                          onClick={() => setOpen(false)}
                          className="rounded-sm bg-primary px-2.5 py-1 text-xs font-medium text-white transition-[transform,background-color] duration-150 ease-out hover:bg-primary-dark active:scale-[0.97]"
                        >
                          {a.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start" role="status" aria-label="Assistant is preparing a reply">
                <div className="flex items-center gap-2 rounded-md bg-bg px-3 py-2 text-sm text-muted">
                  <span className="flex items-center gap-1" aria-hidden="true">
                    <span className="chat-typing-dot" />
                    <span className="chat-typing-dot chat-typing-dot-delay-one" />
                    <span className="chat-typing-dot chat-typing-dot-delay-two" />
                  </span>
                  <span>Curo Assistant is typing</span>
                </div>
              </div>
            )}
          </div>

          <ChatOptions
            prompts={suggestedPrompts}
            isGuest={!account}
            disabled={isTyping}
            onSelect={handleSend}
            onNavigate={() => setOpen(false)}
          />

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-line bg-surface px-3 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              aria-label="Message Curo Assistant"
              disabled={isTyping}
              className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 ease-out placeholder:text-faint focus:border-primary"
            />
            <button
              onClick={() => handleSend()}
              aria-label="Send"
              disabled={!input.trim() || isTyping}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white transition-[transform,background-color] duration-150 ease-out hover:bg-primary-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </section>
      )}
    </>
  );
}
