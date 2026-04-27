"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, MessageSquare, Send, X, User, Loader2, Minimize2, Sparkles, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    role: "user" | "assistant"
    content: string
    image?: string
}

export function MiniChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm your Autoworx AI Assistant. How can I help you with your car today?" }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 800
                    const MAX_HEIGHT = 800
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    // Compress to JPEG with 70% quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
                    resolve(dataUrl)
                }
            }
        })
    }

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const compressed = await compressImage(file)
            setSelectedImage(compressed)
        }
    }

    const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = e.clipboardData?.items
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const file = items[i].getAsFile()
                    if (file) {
                        e.preventDefault() // prevent default text pasting if it's an image
                        const compressed = await compressImage(file)
                        setSelectedImage(compressed)
                        break
                    }
                }
            }
        }
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isLoading])

    const handleSend = async () => {
        if ((!input.trim() && !selectedImage) || isLoading) return

        const userMessage: Message = { role: "user", content: input, image: selectedImage || undefined }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setSelectedImage(null)
        setIsLoading(true)

        try {
            const response = await fetch("/api/chat/customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                        image: m.image
                    }))
                })
            })

            if (!response.ok) {
                throw new Error("Server or Network Error")
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error("No stream available")

            const decoder = new TextDecoder()
            let aiText = ""

            // Add initial empty assistant message
            setMessages(prev => [...prev, { role: "assistant", content: "" }])
            // Turn off loading animation since stream is actively responding
            setIsLoading(false)

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                aiText += chunk

                // Update the very last message (which is our assistant message above) with the fast incoming chunks
                setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = {
                        ...newMessages[newMessages.length - 1],
                        content: aiText
                    }
                    return newMessages
                })
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, there's no internet connection or server is busy. Please try again." }])
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end max-w-[calc(100vw-2rem)]">
            {isOpen ? (
                <Card className="w-[calc(100vw-2rem)] sm:w-[380px] h-[70vh] sm:h-[500px] flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5 duration-300 overflow-hidden bg-background/95 backdrop-blur-md">
                    <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base flex items-center gap-2 font-bold">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-primary shadow-sm flex items-center justify-center">
                                <div className="absolute w-[85%] h-[85%] bg-white rounded-full" />
                                <img src="/chatbot.png" alt="AI" className="relative z-10 w-full h-full object-cover" />
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
                                            "relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 border overflow-hidden",
                                            m.role === "assistant" ? "bg-primary border-primary/30 text-primary shadow-sm" : "bg-muted border-border"
                                        )}>
                                            {m.role === "assistant" ? (
                                                <>
                                                    <div className="absolute w-[85%] h-[85%] bg-white rounded-full" />
                                                    <img src="/chatbot.png" alt="AI" className="relative z-10 w-full h-full object-cover" />
                                                </>
                                            ) : <User className="relative z-10 w-4 h-4" />}
                                        </div>
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap flex flex-col gap-2",
                                            m.role === "assistant" ? "bg-secondary text-foreground rounded-tl-none font-medium" : "bg-primary text-primary-foreground rounded-tr-none"
                                        )}>
                                            {m.image && (
                                                <img src={m.image} alt="Uploaded" className="max-w-[200px] rounded-md max-h-[200px] object-cover" />
                                            )}
                                            {m.content.replace("[BOOK_APPOINTMENT]", "").trim()}
                                            {m.role === "assistant" && m.content.includes("[BOOK_APPOINTMENT]") && (
                                                <Button size="sm" className="mt-2 w-full gap-2 rounded-xl shadow-md" asChild>
                                                    <Link href="/contact">
                                                        <Calendar className="w-4 h-4" />
                                                        Book Service Appointment
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-3 mr-auto max-w-[80%] items-center">
                                        <div className="relative w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center overflow-hidden shadow-sm bg-primary">
                                            <div className="absolute w-[85%] h-[85%] bg-white rounded-full" />
                                            <img src="/chatbot.png" alt="AI" className="relative z-10 w-full h-full object-cover" />
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

                    <CardFooter className="p-4 border-t bg-background/50 flex flex-col items-start gap-2">
                        {selectedImage && (
                            <div className="relative">
                                <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-md border" />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0 rounded-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                            </Button>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            <Input
                                placeholder="How can we help with your car?"
                                value={input}
                                onPaste={handlePaste}
                                onChange={(e) => setInput(e.target.value)}
                                className="bg-background border-primary/10 focus-visible:ring-primary shadow-inner rounded-full px-4"
                            />
                            <Button type="submit" size="icon" disabled={isLoading} className="shadow-lg rounded-full shrink-0">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    size="icon"
                    className="h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform bg-primary group overflow-hidden p-0 border-0"
                >
                    <div className="relative w-full h-full bg-primary flex items-center justify-center">
                        <div className="absolute w-[85%] h-[85%] bg-white rounded-full" />
                        <img src="/chatbot.png" alt="Chatbot" className="relative z-10 w-full h-full object-cover" />
                    </div>
                </Button>
            )}
        </div>
    )
}
