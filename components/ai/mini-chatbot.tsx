"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, MessageSquare, Send, X, User, Loader2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    role: "user" | "assistant"
    content: string
}

export function MiniChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm your AutoWorx AI Assistant. How can I help you with your vehicle today?" }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isLoading])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage]
                })
            })

            const data = await response.json()
            if (data.message) {
                setMessages(prev => [...prev, { role: "assistant", content: data.message }])
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }])
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Failed to connect to AI. Is your internet active?" }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen ? (
                <Card className="w-[380px] h-[500px] flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5 duration-300 overflow-hidden bg-background/95 backdrop-blur-md">
                    <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base flex items-center gap-2 font-bold">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <Bot className="w-5 h-5" />
                            </div>
                            AutoWorx AIS
                        </CardTitle>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/10" onClick={() => setIsOpen(false)}>
                                <Minimize2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-4">
                                {messages.map((m, i) => (
                                    <div key={i} className={cn("flex gap-3 max-w-[85%]", m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                            m.role === "assistant" ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border"
                                        )}>
                                            {m.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                        </div>
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap",
                                            m.role === "assistant" ? "bg-muted text-foreground rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none"
                                        )}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-3 mr-auto max-w-[80%] items-center">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="bg-muted rounded-2xl px-4 py-2 text-sm flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <CardFooter className="p-4 border-t bg-background/50">
                        <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                            <Input
                                placeholder="Ask about repairs..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="bg-background border-primary/10 focus-visible:ring-primary shadow-inner"
                            />
                            <Button type="submit" size="icon" disabled={isLoading} className="shadow-lg">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform bg-primary group"
                >
                    <div className="relative">
                        <MessageSquare className="h-6 w-6 group-hover:hidden" />
                        <Sparkles className="h-6 w-6 hidden group-hover:block animate-pulse" />
                    </div>
                </Button>
            )}
        </div>
    )
}

function Sparkles(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    )
}
