"use client"

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { motion } from 'framer-motion'

interface MermaidProps {
  chart: string
  className?: string
}

export function Mermaid({ chart, className = "" }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState<string>("")
  const [id] = useState(() => `mermaid-${Math.random().toString(36).substring(2, 9)}`)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#10b981',
        primaryTextColor: '#fff',
        primaryBorderColor: '#059669',
        lineColor: '#64748b',
        secondaryColor: '#f59e0b',
        tertiaryColor: '#3b82f6',
        mainBkg: '#0f172a',
        nodeBorder: '#1e293b',
        clusterBkg: 'rgba(30, 41, 59, 0.5)',
        clusterBorder: '#334155',
        fontSize: '12px',
      },
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
    })

    const renderChart = async () => {
      try {
        if (!chart.trim()) return
        const { svg } = await mermaid.render(id, chart)
        
        // Inject CSS for "Live" line animations and interactive glows
        const animatedSvg = svg.replace(
          '</style>',
          `
          /* Live Pulsing Flow Animation */
          @keyframes glow-flow {
            0% {
              stroke-dashoffset: 20;
              stroke: #10b981;
              stroke-width: 2.5px;
              filter: drop-shadow(0 0 2px #10b981);
            }
            50% {
              stroke: #3b82f6;
              stroke-width: 3.5px;
              filter: drop-shadow(0 0 8px #3b82f6);
            }
            100% {
              stroke-dashoffset: 0;
              stroke: #10b981;
              stroke-width: 2.5px;
              filter: drop-shadow(0 0 2px #10b981);
            }
          }

          .edgePath .path {
            stroke-dasharray: 10, 5;
            animation: glow-flow 3s linear infinite;
            stroke-linecap: round;
            transition: all 0.3s ease;
          }

          /* Interactive Hover for Flowlines */
          .edgePath:hover .path {
            stroke-width: 6px !important;
            stroke: #f59e0b !important;
            filter: drop-shadow(0 0 12px #f59e0b) !important;
            animation-duration: 0.8s; /* Speed up on hover */
          }

          /* Node Pulse & Hover */
          .node rect, .node circle, .node polygon, .node path {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            stroke-width: 2px;
          }

          .node:hover rect, .node:hover circle, .node:hover polygon, .node:hover path {
            transform: scale(1.05);
            fill: #1e293b !important;
            stroke: #3b82f6 !important;
            stroke-width: 4px !important;
            filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.6)) !important;
          }

          /* Markers (Arrowheads) */
          .marker {
            fill: #10b981 !important;
            transition: all 0.3s ease;
          }
          .edgePath:hover .marker {
            fill: #f59e0b !important;
            transform: scale(1.2);
          }
          </style>`
        )
        setSvgContent(animatedSvg)
      } catch (error) {
        console.error("Failed to render mermaid chart", error)
      }
    }

    renderChart()
  }, [chart, id])

  if (!svgContent) {
    return (
      <div className={`flex justify-center items-center h-64 w-full bg-secondary/10 rounded-xl animate-pulse ${className}`}>
        <span className="text-muted-foreground text-sm tracking-widest uppercase">Rendering System Architecture...</span>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      ref={containerRef} 
      className={`mermaid-container flex justify-center w-full overflow-auto p-8 rounded-2xl shadow-2xl border border-white/10 bg-background/50 backdrop-blur-md ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}
