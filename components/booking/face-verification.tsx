"use client"

import React, { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ScanFace, RefreshCw, ShieldCheck, UserCheck, ShieldAlert, Scan, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    FaceMesh: any;
    FACEMESH_TESSELATION: any;
  }
}

interface FaceVerificationProps {
  onVerified: (verified: boolean) => void
}

type DetectionState = "searching" | "detecting" | "stabilizing" | "active-scan" | "liveness-left" | "liveness-right" | "verified"

export function FaceVerification({ onVerified }: FaceVerificationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<"idle" | "requesting" | "scanning" | "verified" | "error">("idle")
  const [detectionState, setDetectionState] = useState<DetectionState>("searching")
  const [errorMessage, setErrorMessage] = useState("")
  const [scanProgress, setScanProgress] = useState(0)
  const [libsReady, setLibsReady] = useState(false)
  const [instruction, setInstruction] = useState("Initializing...")
  
  const faceMeshRef = useRef<any>(null)
  const streakCount = useRef(0)
  const livenessPhase = useRef<"none" | "waiting-left" | "waiting-right" | "done">("none")
  const leftConfirmed = useRef(false)
  const rightConfirmed = useRef(false)

  // 1. Load the Resilient MediaPipe Library (Using the same method as javiersiliacay-portfolio)
  useEffect(() => {
    let isMounted = true;
    const scripts = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
    ];

    let loaded = 0;
    const loadHandler = () => {
      loaded++;
      if (loaded === scripts.length && isMounted) {
         setLibsReady(true);
         console.log("MediaPipe FaceMesh Loaded successfully.");
      }
    };

    scripts.forEach(src => {
      if (document.querySelector(`script[src="${src}"]`)) {
         loadHandler();
         return;
      }
      const s = document.createElement("script");
      s.src = src; 
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = loadHandler;
      s.onerror = (e) => console.error("Script load error:", src, e);
      document.head.appendChild(s);
    });

    return () => { isMounted = false; }
  }, []);

  // Initialize the FaceMesh model when scanning
  useEffect(() => {
    if (status !== "scanning" || !libsReady || !window.FaceMesh || faceMeshRef.current) return;

    try {
        console.log("Initializing FaceMesh Core...");
        const faceMesh = new window.FaceMesh({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
        });
        
        faceMesh.setOptions({ 
           maxNumFaces: 1, 
           refineLandmarks: true, 
           minDetectionConfidence: 0.7,
           minTrackingConfidence: 0.7 
        });
        
        faceMesh.onResults((res: any) => handleFaceResults(res));
        faceMeshRef.current = faceMesh;
        setInstruction("Position your face within the frame.");
    } catch(err) {
        console.error("FaceMesh Init Error:", err);
    }

    return () => {
        if (faceMeshRef.current) {
            faceMeshRef.current.close();
            faceMeshRef.current = null;
        }
    }
  }, [status, libsReady]);

  const handleFaceResults = (results: any) => {
    if (status === "verified") return;
    
    // Draw full face mesh wireframe + highlighted keypoints
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
         const cw = canvasRef.current.width;
         const ch = canvasRef.current.height;
         ctx.clearRect(0, 0, cw, ch);
         
         if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // ── Draw tesselation mesh using MediaPipe's drawConnectors if available ──
            if (window.FACEMESH_TESSELATION && (window as any).drawConnectors) {
              (window as any).drawConnectors(ctx, landmarks, window.FACEMESH_TESSELATION, {
                color: "rgba(59, 130, 246, 0.12)",
                lineWidth: 0.5,
              });
            }
            
            // ── Draw face contour lines (jawline, eyebrows) ──
            const contourSets = [
              // Jawline
              [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
              // Left eyebrow
              [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
              // Right eyebrow
              [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
            ];
            
            ctx.save();
            ctx.strokeStyle = "rgba(59, 130, 246, 0.35)";
            ctx.lineWidth = 1;
            contourSets.forEach(indices => {
              ctx.beginPath();
              indices.forEach((idx, i) => {
                const pt = landmarks[idx];
                if (pt) {
                  if (i === 0) ctx.moveTo(pt.x * cw, pt.y * ch);
                  else ctx.lineTo(pt.x * cw, pt.y * ch);
                }
              });
              ctx.stroke();
            });
            ctx.restore();
            
            // ── Draw highlighted keypoints with glow ──
            // Eyes, iris, nose, mouth, forehead, chin
            const keypoints = [
              // Left eye
              33, 133, 159, 145,
              // Right eye 
              263, 362, 386, 374,
              // Nose
              1, 4, 5,
              // Mouth
              61, 291, 13, 14,
              // Forehead & chin
              10, 152,
              // Cheeks
              234, 454,
            ];
            
            ctx.save();
            keypoints.forEach(idx => {
              const pt = landmarks[idx];
              if (pt) {
                // Outer glow
                ctx.shadowBlur = 8;
                ctx.shadowColor = "#3b82f6";
                ctx.fillStyle = "#3b82f6";
                ctx.beginPath();
                ctx.arc(pt.x * cw, pt.y * ch, 2.5, 0, 2 * Math.PI);
                ctx.fill();
                
                // Bright center
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#93c5fd";
                ctx.beginPath();
                ctx.arc(pt.x * cw, pt.y * ch, 1, 0, 2 * Math.PI);
                ctx.fill();
              }
            });
            ctx.restore();
         }
      }
    }

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
       const landmarks = results.multiFaceLandmarks[0];
       
       // Calculate Bounding Box to determine if face is centered
       let minX = 1, maxX = 0, minY = 1, maxY = 0;
       landmarks.forEach((pt: any) => {
          if (pt.x < minX) minX = pt.x;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
       });
       
       const faceCenterX = (minX + maxX) / 2;
       const faceCenterY = (minY + maxY) / 2;
       const isCentered = Math.abs(faceCenterX - 0.5) < 0.2 && Math.abs(faceCenterY - 0.5) < 0.2;

       // ── Head Rotation Detection (for liveness) ──
       // Nose tip = landmark 1, Left ear = 234, Right ear = 454
       const nose = landmarks[1];
       const leftEar = landmarks[234];
       const rightEar = landmarks[454];
       
       let headYaw = 0; // negative = looking left, positive = looking right
       if (nose && leftEar && rightEar) {
          const noseToLeft = Math.abs(nose.x - leftEar.x);
          const noseToRight = Math.abs(nose.x - rightEar.x);
          // Ratio: when centered ≈ 1.0, left turn < 0.6, right turn > 1.6
          headYaw = noseToRight / (noseToLeft + 0.001);
       }

       // ── Liveness Challenge Logic ──
       if (livenessPhase.current === "waiting-left") {
          // Detect left turn (headYaw drops below 0.55 means nose is closer to left ear = looking left)
          if (headYaw < 0.55) {
             leftConfirmed.current = true;
             livenessPhase.current = "waiting-right";
             setDetectionState("liveness-right");
             setInstruction("Good! Now slowly look to your RIGHT.");
          } else {
             setDetectionState("liveness-left");
             setInstruction("Slowly turn your head to the LEFT.");
          }
          return;
       }
       
       if (livenessPhase.current === "waiting-right") {
          // Detect right turn (headYaw goes above 1.8 means nose is closer to right ear = looking right)
          if (headYaw > 1.8) {
             rightConfirmed.current = true;
             livenessPhase.current = "done";
             setDetectionState("active-scan");
             setInstruction("Liveness confirmed! Completing scan...");
          } else {
             setDetectionState("liveness-right");
             setInstruction("Now slowly look to your RIGHT.");
          }
          return;
       }

       if (!isCentered) {
          streakCount.current = Math.max(0, streakCount.current - 1);
          setDetectionState("searching");
          setInstruction("Face not centered. Please align within the guide frame.");
       } else {
          streakCount.current++;
          if (streakCount.current > 15) {
             setDetectionState("active-scan");
             
             // ── Trigger liveness challenge at 50% ──
             if (livenessPhase.current === "none") {
                setScanProgress(p => {
                   const next = Math.min(p + 1.5, 100);
                   if (next >= 50 && livenessPhase.current === "none") {
                      livenessPhase.current = "waiting-left";
                      setDetectionState("liveness-left");
                      setInstruction("Liveness check: Slowly turn your head to the LEFT.");
                   }
                   return Math.min(next, 50); // Cap at 50 until liveness is done
                });
             } else if (livenessPhase.current === "done") {
                setInstruction("Almost done! Hold still...");
                setScanProgress(p => Math.min(p + 2, 100));
             }
          } else {
             setDetectionState("stabilizing");
             setInstruction("Face detected. Please hold still for scanning.");
          }
       }
    } else {
       streakCount.current = Math.max(0, streakCount.current - 1);
       if (streakCount.current < 3) {
          setDetectionState("searching");
          setInstruction("No face detected. Please position your face within the frame.");
       }
    }
  };

  // Inference Loop
  useEffect(() => {
    let animId: number;
    const processFrame = async () => {
      if (status === "scanning" && videoRef.current && videoRef.current.readyState >= 2 && faceMeshRef.current) {
         try {
            await faceMeshRef.current.send({ image: videoRef.current });
         } catch(e) {}
      }
      if (status === "scanning") {
         animId = requestAnimationFrame(processFrame);
      }
    };
    if (status === "scanning") {
       animId = requestAnimationFrame(processFrame);
    }
    return () => cancelAnimationFrame(animId);
  }, [status]);

  // Verification Logic
  useEffect(() => {
    if (scanProgress >= 100 && status === "scanning") {
       setStatus("verified");
       setDetectionState("verified");
       onVerified(true);
       stopCamera();
    }
  }, [scanProgress, status, onVerified]);

  const startCamera = async () => {
    setStatus("requesting");
    setErrorMessage("");
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setStream(ms);
      setStatus("scanning");
      setScanProgress(0);
      streakCount.current = 0;
    } catch (e) { 
      setStatus("error");
      setErrorMessage("Camera access is required for secure authentication. Please allow camera permissions."); 
    }
  };

  const stopCamera = () => { 
    if (stream) { 
        stream.getTracks().forEach(t => t.stop()); 
        setStream(null);
    } 
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => videoRef.current?.play();
    }
  }, [stream]);

  // Status indicator config — clean, minimal color coding
  const statusConfig = {
    searching:      { dot: "bg-red-500",    text: "text-red-500",    border: "border-red-500/20" },
    detecting:      { dot: "bg-yellow-500", text: "text-yellow-500", border: "border-yellow-500/20" },
    stabilizing:    { dot: "bg-amber-500",  text: "text-amber-500",  border: "border-amber-500/20" },
    "active-scan":  { dot: "bg-primary",    text: "text-primary",    border: "border-primary/30" },
    "liveness-left":{ dot: "bg-cyan-500",   text: "text-cyan-400",   border: "border-cyan-500/30" },
    "liveness-right":{ dot: "bg-cyan-500",  text: "text-cyan-400",   border: "border-cyan-500/30" },
    verified:       { dot: "bg-green-500",  text: "text-green-500",  border: "border-green-500/30" },
  }[detectionState] || { dot: "bg-muted-foreground", text: "text-muted-foreground", border: "border-border" };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* ── IDLE STATE ── */}
        {status === "idle" && (
          <motion.div 
            key="idle" 
            className="p-8 bg-card rounded-xl border border-border text-center" 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-primary/10 text-primary mb-5">
              <ScanFace className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground mb-2">Biometric Face Verification</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              To verify you&apos;re human, please complete a quick face scan. No biometric data is recorded or transmitted and your privacy is protected.
            </p>
            <Button 
              onClick={startCamera} 
              disabled={!libsReady} 
              className="gap-2 group"
            >
              {libsReady 
                ? <><Scan className="w-4 h-4 group-hover:scale-110 transition-transform" /> Start Face Scan</> 
                : <><Loader2 className="w-4 h-4 animate-spin" /> Loading Resources...</>
              }
            </Button>
          </motion.div>
        )}

        {/* ── ERROR STATE ── */}
        {status === "error" && (
          <motion.div 
            key="error" 
            className="p-8 bg-card rounded-xl border border-destructive/30 text-center" 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-destructive/10 text-destructive mb-5">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground mb-2">Camera Access Denied</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">{errorMessage}</p>
            <Button onClick={startCamera} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          </motion.div>
        )}

        {/* ── SCANNING STATE ── */}
        {(status === "scanning" || status === "requesting") && (
          <motion.div 
            key="scanning" 
            className="bg-card rounded-xl border border-border overflow-hidden" 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* Camera viewport */}
            <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay playsInline muted 
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
              />
              <canvas 
                ref={canvasRef} 
                width={640} height={480} 
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none z-10" 
              />
              
              {/* Clean corner brackets overlay */}
              <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                <div className="w-[65%] h-[75%] relative">
                  {/* Top-left */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl-md" />
                  {/* Top-right */}
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr-md" />
                  {/* Bottom-left */}
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl-md" />
                  {/* Bottom-right */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br-md" />
                </div>
              </div>

              {/* Liveness direction arrow overlay */}
              {(detectionState === "liveness-left" || detectionState === "liveness-right") && (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                  <motion.div 
                    className="flex items-center gap-3 bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {detectionState === "liveness-left" ? (
                      <>
                        <motion.span 
                          className="text-3xl"
                          animate={{ x: [-5, 5, -5] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        >⟵</motion.span>
                        <span className="text-white text-sm font-bold uppercase tracking-wider">Look Left</span>
                      </>
                    ) : (
                      <>
                        <span className="text-white text-sm font-bold uppercase tracking-wider">Look Right</span>
                        <motion.span 
                          className="text-3xl"
                          animate={{ x: [5, -5, 5] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        >⟶</motion.span>
                      </>
                    )}
                  </motion.div>
                </div>
              )}

              {/* Requesting overlay */}
              {status === "requesting" && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground font-medium">Starting camera...</span>
                </div>
              )}
            </div>

            {/* Status bar beneath camera */}
            <div className="p-5 space-y-4">
              {/* Status indicator row */}
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${statusConfig.dot} ${detectionState === 'active-scan' ? 'animate-pulse' : ''}`} />
                <p className={`text-sm font-medium ${statusConfig.text}`}>
                  {instruction}
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Scan progress</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${scanProgress}%` }} 
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Privacy note */}
              <div className="flex items-center gap-2 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground">
                  Processing locally. No data is transmitted.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── VERIFIED STATE ── */}
        {status === "verified" && (
          <motion.div 
            key="verified" 
            className="p-8 bg-card rounded-xl border border-green-500/30 text-center" 
            initial={{ opacity: 0, scale: 0.97 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-green-500/10 text-green-500 mb-5">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground mb-2">Human Verified</h3>
            <p className="text-sm text-muted-foreground">Biometric identity confirmed. You may proceed.</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
