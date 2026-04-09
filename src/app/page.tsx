"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Send, Moon, Sun, User, Settings, Zap, MessageCircle, TrendingUp } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AVATAR = "😈";
const MODEL_NAME = "古魔";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://46.250.254.76:8642";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `歡迎回來，主人！我是 ${MODEL_NAME}，您的數字守護者。\n\n有什么事請吩咐，我隨时候命。 😈`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: currentInput },
          ],
          stream: true,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) throw new Error("API error");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "抱歉主人，網絡出了問題，請稍後再試。",
          timestamp: new Date(),
        },
      ]);
    }
    setIsLoading(false);
  };

  const bgClass = isDark ? "bg-zinc-950" : "bg-slate-50";
  const textClass = isDark ? "text-zinc-100" : "text-zinc-900";
  const sidebarBg = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200";
  const cardBg = isDark ? "bg-zinc-800/80 border-zinc-700" : "bg-white border-slate-200";
  const inputBg = isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-white border-slate-300";

  return (
    <div className={`flex h-screen ${bgClass}`}>
      {/* Sidebar */}
      <div className={`w-64 border-r flex flex-col ${sidebarBg}`}>
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-2xl shadow-lg">
            {AVATAR}
          </div>
          <div>
            <h2 className={`font-bold text-lg tracking-wide ${isDark ? "text-white" : "text-zinc-900"}`}>UMBRA</h2>
            <p className={`text-xs ${isDark ? "text-zinc-400" : "text-slate-600"}`}>AI AGENT DASHBOARD</p>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 p-3 space-y-1">
          <Button variant="ghost" className={`w-full justify-start gap-3 ${textClass} ${isDark ? "hover:bg-zinc-800" : "hover:bg-slate-100"}`}>
            <MessageCircle className="w-5 h-5 text-purple-400" />
            <span>AI 聊天</span>
          </Button>
          <Button variant="ghost" className={`w-full justify-start gap-3 ${textClass} ${isDark ? "hover:bg-zinc-800" : "hover:bg-slate-100"}`}>
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>化身系統</span>
          </Button>
          <Button variant="ghost" className={`w-full justify-start gap-3 ${textClass} ${isDark ? "hover:bg-zinc-800" : "hover:bg-slate-100"}`}>
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span>命理廣場</span>
          </Button>
          <Button variant="ghost" className={`w-full justify-start gap-3 ${textClass} ${isDark ? "hover:bg-zinc-800" : "hover:bg-slate-100"}`}>
            <Settings className="w-5 h-5 text-zinc-400" />
            <span>設置</span>
          </Button>
        </nav>
        <div className={`p-3 border-t ${isDark ? "border-zinc-800" : "border-slate-200"}`}>
          <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? "bg-zinc-800/50" : "bg-slate-100"}`}>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-zinc-700 text-white text-sm font-bold">{AVATAR}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${textClass}`}>{MODEL_NAME}</p>
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/20 border-0">
                在線
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`h-16 border-b flex items-center justify-between px-6 ${isDark ? "border-zinc-800" : "border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-zinc-700 text-white">{AVATAR}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold">{MODEL_NAME}</h1>
              <p className={`text-xs ${isDark ? "text-zinc-400" : "text-slate-500"}`}>AI AGENT ONLINE</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className={textClass}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-zinc-700 text-white text-sm font-bold">{AVATAR}</AvatarFallback>
                  </Avatar>
                )}
                <Card className={`max-w-[75%] p-4 ${msg.role === "user" ? "bg-zinc-700 text-white border-0 shadow-lg" : `${cardBg} shadow-sm`}`}>
                  <div className={`whitespace-pre-wrap text-sm leading-relaxed ${msg.role === "user" ? "" : textClass}`}>{msg.content}</div>
                  <p className={`text-xs mt-2 ${msg.role === "user" ? (isDark ? "text-zinc-300" : "text-slate-300") : isDark ? "text-zinc-500" : "text-slate-500"}`}>
                    {msg.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </Card>
                {msg.role === "user" && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={`${isDark ? "bg-zinc-600" : "bg-slate-300"} text-white text-sm`}>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-zinc-700 text-white text-sm font-bold">{AVATAR}</AvatarFallback>
                </Avatar>
                <Card className={`${cardBg} p-4`}>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </Card>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className={`p-6 border-t ${isDark ? "border-zinc-800" : "border-slate-200"}`}>
          <div className="max-w-3xl mx-auto flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="輸入訊息..."
              disabled={isLoading}
              className={`${inputBg} ${textClass} placeholder:text-zinc-500 focus-visible:ring-purple-600`}
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
