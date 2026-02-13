"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, User, Wrench, Minus, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
    role: "user" | "assistant"
    content: string
}

export function CustomerChatBubble() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hello! Welcome to Autoworx. I'm your AI assistant. How can I help you with your car today?",
        },
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: "user", content: input }
        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/chat/customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setMessages((prev) => [...prev, { role: "assistant", content: data.message }])
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again later." },
                ])
            }
        } catch (error) {
            console.error("Chat error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl z-50 bg-primary hover:bg-primary/90 transition-all duration-300 scale-100 hover:scale-110 active:scale-95"
            >
                <MessageCircle className="w-7 h-7" />
            </Button>
        )
    }

    return (
        <Card className={`fixed bottom-6 right-6 w-[350px] shadow-2xl z-50 border-primary/20 overflow-hidden transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[500px]'}`}>
            <CardHeader className="bg-primary text-primary-foreground p-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        <Wrench className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-bold">Autoworx Assistant</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/20"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/20"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            {!isMinimized && (
                <>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[380px] p-4">
                            <div className="space-y-4" ref={scrollRef}>
                                {messages.map((m, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === "assistant" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                                                {m.role === "assistant" ? <Wrench className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            </div>
                                            <div
                                                className={`p-3 rounded-2xl text-sm ${m.role === "user"
                                                    ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                                                    : "bg-secondary text-secondary-foreground rounded-tl-none border border-secondary"
                                                    }`}
                                            >
                                                {m.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="flex gap-2 max-w-[85%] items-center">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                                                <Wrench className="w-4 h-4" />
                                            </div>
                                            <div className="bg-secondary p-3 rounded-2xl rounded-tl-none">
                                                <div className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <CardFooter className="p-3 border-t bg-background">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                handleSend()
                            }}
                            className="flex w-full gap-2"
                        >
                            <Input
                                placeholder="Ask me anything..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                className="flex-1 rounded-full bg-secondary/50 border-none focus-visible:ring-primary"
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-full shadow-lg">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </>
            )}
        </Card>
    )
}
