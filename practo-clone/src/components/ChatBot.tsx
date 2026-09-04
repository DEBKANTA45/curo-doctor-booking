"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Stethoscope, AlertTriangle } from "lucide-react";
import { generateReply, ChatAction } from "@/lib/chatbot-data";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  actions?: ChatAction[];
  isEmergency?: boolean;
}

const LOGGED_OUT_WELCOME =
  "Hi, I'm the Curo Assistant. I can help with general medical questions (like which specialist to see) and with using this app — booking, appointments, profile, and more. I'm not a substitute for professional medical advice.";

function getWelcomeText(account: { role: "patient" | "doctor"; name: string } | null) {
  if (!account) return LOGGED_OUT_WELCOME;
  if (account.role === "doctor") {
    return `Welcome, ${account.name}! How can I help you today? I can help with things like managing your schedule, updating your profile, or your patient appointments.`;
  }
  return `Welcome, ${account.name}! How can I help you today? I can help with things like finding a doctor, booking or managing appointments, or your profile.`;
}

let idCounter = 0;
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

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = { id: nextId(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulated thinking delay for a natural chat feel
    setTimeout(() => {
      const reply = generateReply(trimmed, account?.role ?? null);
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
    }, 450);
  };

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
        className="fixed bottom-5 right-5 z-50 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-dark"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        <span className="text-sm font-medium">{open ? "Close" : "Need help?"}</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-xl">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-line bg-primary-light px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
              <Stethoscope size={16} />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-ink">Curo Assistant</p>
              <p className="text-xs text-muted">Medical & app help only</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
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
                          className="rounded-sm bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-dark"
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
              <div className="flex justify-start">
                <div className="rounded-md bg-bg px-3 py-2 text-sm text-muted">Typing…</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-line px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about symptoms, doctors, bookings…"
              className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
            <button
              onClick={handleSend}
              aria-label="Send"
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}