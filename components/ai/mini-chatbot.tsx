"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, MessageSquare, Send, X, User, Loader2, Minimize2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    role: "user" | "assistant"
    content: string
}

export function MiniChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm your Autoworx AI Assistant. How can I help you with your car today?" }
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
            const response = await fetch("/api/chat/customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            })

            const data = await response.json()
            if (data.message) {
                setMessages(prev => [...prev, { role: "assistant", content: data.message }])
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }])
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Failed to connect to AI. Please check your internet." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end max-w-[calc(100vw-2rem)]">
            {isOpen ? (
                <Card className="w-[calc(100vw-2rem)] sm:w-[380px] h-[70vh] sm:h-[500px] flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5 duration-300 overflow-hidden bg-background/95 backdrop-blur-md">
                    <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base flex items-center gap-2 font-bold">
                            <div className="bg-white/20 p-1.5 rounded-lg text-white">
                                <Bot className="w-5 h-5" />
                            </div>
                            Autoworx AI Assistant
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
                                            m.role === "assistant" ? "bg-primary/20 border-primary/30 text-primary shadow-sm" : "bg-muted border-border"
                                        )}>
                                            {m.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                        </div>
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap",
                                            m.role === "assistant" ? "bg-secondary text-foreground rounded-tl-none font-medium" : "bg-primary text-primary-foreground rounded-tr-none"
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
                                placeholder="How can we help with your car?"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="bg-background border-primary/10 focus-visible:ring-primary shadow-inner rounded-full px-4"
                            />
                            <Button type="submit" size="icon" disabled={isLoading} className="shadow-lg rounded-full">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    size="icon"
                    className="h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform bg-primary group"
                >
                    <div className="relative">
                        <Bot className="h-7 w-7 text-white" />
                    </div>
                </Button>
            )}
        </div>
    )
}
