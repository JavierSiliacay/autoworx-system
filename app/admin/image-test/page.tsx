"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ImageTestPage() {
    const [prompt, setPrompt] = useState("A stunning close-up portrait of a vibrant kingfisher bird perched on a mossy branch");
    const [model, setModel] = useState("black-forest-labs/FLUX.1-schnell");
    const [resultImage, setResultImage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleTest = async () => {
        setLoading(true);
        setResultImage("");
        setError("");
        try {
            const res = await fetch("/api/admin/image-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, model })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch image from HuggingFace");
            }

            setResultImage(data.image);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Image Generator</h1>
                <p className="text-muted-foreground mt-2">Generate vivid images using HuggingFace Text-to-Image models natively.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Generator Configuration</CardTitle>
                    <CardDescription>Specify the text-to-image model ID and describe what you want to see.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Model ID</label>
                        <Input 
                            value={model} 
                            onChange={(e) => setModel(e.target.value)} 
                            placeholder="e.g. black-forest-labs/FLUX.1-schnell"
                        />
                        <p className="text-xs text-muted-foreground">Other examples: stabilityai/stable-diffusion-3.5-large</p>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Image Prompt</label>
                        <Textarea 
                            rows={4}
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)} 
                            placeholder="Describe the image you want..."
                        />
                    </div>
                    
                    <Button onClick={handleTest} disabled={loading || !prompt} className="w-40">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Drawing..." : "Generate Image"}
                    </Button>
                </CardContent>
            </Card>

            {(resultImage || error) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Rendered Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-md whitespace-pre-wrap font-mono text-sm">
                                {error}
                            </div>
                        )}
                        {resultImage && (
                            <div className="rounded-lg overflow-hidden border border-border shadow-sm flex items-center justify-center bg-muted/30">
                                <img src={resultImage} alt="Generated AI Image" className="max-w-full h-auto max-h-[600px] object-contain rounded-md" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
