"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AITestPage() {
    const [prompt, setPrompt] = useState("Describe this image in one sentence.");
    const [model, setModel] = useState("google/gemma-4-31B-it:novita");
    const [mediaData, setMediaData] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaData(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setMediaData("");
        }
    };

    const handleTest = async () => {
        setLoading(true);
        setResult("");
        setError("");
        try {
            const res = await fetch("/api/admin/ai-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, model, mediaData })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch from AI");
            }

            setResult(data.result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Model Tester</h1>
                <p className="text-muted-foreground mt-2">Test HuggingFace Router models directly from within the application.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Test Configuration</CardTitle>
                    <CardDescription>Specify the HF model ID and your prompt below. The default is set to novita's gemma-4 endpoint.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Model ID</label>
                        <Input 
                            value={model} 
                            onChange={(e) => setModel(e.target.value)} 
                            placeholder="e.g. google/gemma-4-31B-it:novita"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Test Prompt</label>
                        <Textarea 
                            rows={4}
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)} 
                            placeholder="Type a message to test..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Image / Video Upload (Optional)</label>
                        <Input 
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                        />
                        {mediaData && (
                            <p className="text-xs text-green-600 font-medium">
                                Media attached successfully. Size: {(mediaData.length / 1024).toFixed(2)} KB
                            </p>
                        )}
                    </div>
                    
                    <Button onClick={handleTest} disabled={loading || (!prompt && !mediaData)} className="w-40">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Generating..." : "Run AI Test"}
                    </Button>
                </CardContent>
            </Card>

            {(result || error) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Response Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-md whitespace-pre-wrap font-mono text-sm">
                                {error}
                            </div>
                        )}
                        {result && (
                            <div className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap text-sm leading-relaxed">
                                {result}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

