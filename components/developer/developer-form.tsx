"use client"

import React from "react"
import { Heart, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DeveloperForm() {
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isSuccess, setIsSuccess] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        setIsSubmitting(true)
        setError(null)

        const formData = new FormData(form)
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            type: formData.get('type'),
            message: formData.get('message'),
        }

        try {
            const res = await fetch('/api/developer/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (res.ok) {
                setIsSuccess(true)
                form.reset()
            } else {
                const errData = await res.json()
                setError(errData.error || "Something went wrong. Please try again.")
            }
        } catch (err) {
            console.error(err)
            setError("Failed to send recommendation. Please check your connection.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="py-12 text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 fill-current" />
                </div>
                <h3 className="text-xl font-bold mb-2">Thank you so much!</h3>
                <p className="text-muted-foreground mb-6">Your recommendation has been sent directly to the development team. We appreciate your input!</p>
                <Button onClick={() => setIsSuccess(false)} variant="outline">Sent Another message</Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Name (Optional)</label>
                    <input
                        name="name"
                        placeholder="Juan Dela Cruz"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Suggestion Type *</label>
                    <select
                        name="type"
                        required
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                    >
                        <option value="Feature">New Feature</option>
                        <option value="Improvement">UI/UX Improvement</option>
                        <option value="Bug">Bug Report</option>
                        <option value="Feedback">General Feedback</option>
                    </select>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Email Address (Optional)</label>
                <input
                    name="email"
                    type="email"
                    placeholder="juan@example.com"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Your Recommendation *</label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="I think it would be cool if..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                />
            </div>
            <Button type="submit" className="w-full py-6 text-lg group" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>Progressing...</>
                ) : (
                    <>
                        Send Recommendation
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </Button>
        </form>
    )
}
