// frontend/components/Chatbot.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageCircle, X, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chatbot({
  currentDestination,
}: {
  currentDestination?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your travel assistant. Where are we going?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/chatbot/",
        {
          messages: newMessages,
          context: currentDestination
            ? `The user is currently planning a trip to ${currentDestination}.`
            : "",
        }
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.reply },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window */}
      {isOpen && (
        <div
          className="bg-theme-bg rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden border border-theme-surface"
          style={{ height: "500px" }}
        >
          {/* Header */}
          <div className="bg-theme-primary p-4 text-theme-bg flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle size={20} /> Travel Assistant
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-theme-bg/80 hover:text-theme-bg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-theme-bg/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-theme-primary text-theme-bg rounded-tr-none"
                      : "bg-theme-surface text-theme-text border border-theme-surface rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-theme-surface text-theme-muted border border-theme-surface rounded-2xl rounded-tl-none px-4 py-2 text-sm animate-pulse">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-theme-bg border-t border-theme-surface flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your destination..."
              className="flex-1 bg-theme-surface text-theme-text placeholder:text-theme-muted border border-transparent rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition-all shadow-inner"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-theme-primary text-theme-bg p-2 rounded-full hover:bg-theme-secondary disabled:opacity-50 transition-colors shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-theme-primary hover:bg-theme-secondary text-theme-bg p-4 rounded-full shadow-xl transition-transform transform hover:scale-105"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
}