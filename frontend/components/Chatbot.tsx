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
  const chatbotRef = useRef<HTMLDivElement>(null); // Reference for the click-outside listener

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Click outside to close the chatbot
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        chatbotRef.current &&
        !chatbotRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    
    // Only attach the listener if the chat is actually open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chatbot/`, {
        messages: newMessages,
        context: currentDestination
          ? `The user is currently planning a trip to ${currentDestination}.`
          : "",
      });

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
    <div 
      ref={chatbotRef} 
      // Adjusted bottom/right positioning to be tighter on mobile screens
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3 md:gap-4"
    >
      {/* Chat Window */}
      {isOpen && (
        <div
          // Responsive width and height: w-full with a max width for mobile, h-400px for mobile up to 500px for desktop
          className="bg-theme-bg rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-80 md:w-96 flex flex-col overflow-hidden border border-theme-surface h-[400px] sm:h-[450px] md:h-[500px] max-h-[85vh] transition-all duration-300"
        >
          {/* Header */}
          <div className="bg-theme-primary p-3 md:p-4 text-theme-bg flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" /> Travel Assistant
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-theme-bg/80 hover:text-theme-bg transition-colors"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-theme-bg/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 md:px-4 md:py-2 text-[13px] md:text-sm shadow-sm ${
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
                <div className="bg-theme-surface text-theme-muted border border-theme-surface rounded-2xl rounded-tl-none px-3 py-2 md:px-4 md:py-2 text-[13px] md:text-sm animate-pulse">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-2 md:p-3 bg-theme-bg border-t border-theme-surface flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your destination..."
              className="flex-1 bg-theme-surface text-theme-text placeholder:text-theme-muted border border-transparent rounded-full px-3 py-2 md:px-4 md:py-2 text-[13px] md:text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition-all shadow-inner"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-theme-primary text-theme-bg p-2 md:p-2.5 rounded-full hover:bg-theme-secondary disabled:opacity-50 transition-colors shadow-md flex-shrink-0"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          // Smaller padding on mobile (p-3 vs p-4)
          className="bg-theme-primary hover:bg-theme-secondary text-theme-bg p-3 md:p-4 rounded-full shadow-xl transition-transform transform hover:scale-105"
        >
          {/* Smaller icon on mobile */}
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
        </button>
      )}
    </div>
  );
}