"use client";

import { useState } from "react";
import { X, Send, Bot, Loader2 } from "lucide-react";
import { useLanguage } from "./LanguageContext";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export function AiAssistantDrawer() {
  const { lang, assistantOpen, setAssistantOpen, assistantContext } = useLanguage();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  if (!assistantOpen) return null;

  const isUk = lang === "uk";
  const chips = isUk
    ? [
        "Підкажи фразу досягнення для відео (25–75 симв.)",
        "Як правильно утворити кличний відмінок імені?",
        "Запропонуй ідею зимової казки для 6 років",
      ]
    : [
        "Подскажи фразу достижения для видео (25–75 симв.)",
        "Какой сюжет сказки выбрать для ребёнка 5 лет?",
        "Что лучше выбрать: видео или сказку PDF?",
      ];

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          context: assistantContext,
          message: query,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || data.error || "..." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: isUk ? "Помилка з'єднання з помічником." : "Ошибка соединения с помощником.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-md flex-col border-l border-amber-200/20 bg-[#0e1529] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Bot className="h-5 w-5 text-amber-300" />
            <h2 className="font-semibold text-amber-100">
              {isUk ? "ІІ-помічник VideoVitannya" : "ИИ-помощник VideoVitannya"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAssistantOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <div className="rounded-xl border border-amber-300/20 bg-amber-400/5 p-3 text-slate-200">
            {isUk
              ? "Допоможу сформулювати досягнення для відео (до 90 символів), підказати кличний відмінок або придумати сюжет казки."
              : "Помогу сформулировать достижение для видео (до 90 символов), подобрать имя или придумать сюжет сказки."}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void sendMessage(chip)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-left text-xs text-amber-200 transition hover:bg-amber-400/15"
              >
                {chip}
              </button>
            ))}
          </div>

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`whitespace-pre-wrap rounded-xl p-3 ${
                m.role === "user"
                  ? "ml-8 bg-amber-400/20 text-amber-50"
                  : "mr-6 border border-white/10 bg-white/5 text-slate-200"
              }`}
            >
              {m.text}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
              {isUk ? "Думаю..." : "Думаю..."}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
          className="flex items-center gap-2 border-t border-white/10 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isUk ? "Запитайте ІІ-помічника..." : "Спросите ИИ-помощника..."}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-400 p-2.5 text-[#0b1020] transition hover:bg-amber-300 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
