"use client"

import React, { useState } from 'react'
import { Mermaid } from '@/components/ui/mermaid'
import { motion } from 'framer-motion'
import { RefreshCcw, Network, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const defaultChart = `
graph TD
    %% System Entry Points
    Customer[Customer / Public] -->|Visits| LandingPage[Landing Page]
    Customer -->|Scans QR / Enters Code| TrackPage[Public Tracking Page]
    Customer -->|Fills Form| Booking[Online Booking / Estimate Request]

    %% Admin & Internal
    Admin[Admin / Staff] -->|Login| Dashboard[Admin Dashboard]
    Dashboard --> Appointments[Appointments & History]
    Dashboard --> Costing[Costing & Estimates Generator]
    Dashboard --> AI[AI Analyst & Reports]
    Dashboard --> Gatepass[Gatepass & PDF Generator]
    Dashboard --> Release[Release Monitoring]

    %% Data Flow
    Booking -->|Creates| Appointments
    TrackPage -.->|Reads Status| Appointments
    Appointments -->|Transitions to| Costing
    Costing -->|Generates PDF| EstimatePDF[Repair Estimate PDF]
    Costing -->|Completion| Gatepass
    Gatepass -->|Generates PDF| GatepassPDF[Claim/Gatepass PDF]
    Gatepass -->|Logs Release| Release

    %% AI & Analysis
    Release -->|Aggregated Data| AI
    Appointments -->|Historical Data| AI
    AI -->|Generates| Insights[Business Insights & Charts]

    %% Supabase Backend
    subgraph Database
        DB_Appts[(Appointments Table)]
        DB_History[(History Table)]
        DB_Storage[(Image Storage)]
    end

    Appointments <--> DB_Appts
    Release <--> DB_History
    Gatepass --> DB_History
    Booking --> DB_Storage

    %% Styling
    classDef public fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff;
    classDef admin fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;
    classDef feature fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef db fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;

    class Customer,LandingPage,TrackPage,Booking public;
    class Admin,Dashboard admin;
    class Appointments,Costing,AI,Gatepass,Release feature;
    class DB_Appts,DB_History,DB_Storage db;
`

export default function SystemArchitecturePage() {
  const [key, setKey] = useState(0) // Used to force a re-render/re-animation of the diagram

  const handleRefresh = () => {
    setKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background/95 p-6 md:p-10 space-y-8">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <Link href="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Network className="w-8 h-8 text-primary" />
            System Architecture
          </h1>
          <p className="text-muted-foreground">
            A dynamic, live flowchart of the Autoworx platform's modules, data flow, and database schema.
          </p>
        </div>

        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary text-secondary-foreground px-4 py-2 rounded-lg transition-all active:scale-95 text-sm font-medium border border-border"
        >
          <RefreshCcw className="w-4 h-4" />
          Rerender Diagram
        </button>
      </motion.div>

      {/* Legend & Stats */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center items-start space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-sm font-medium text-foreground">Core Features</span>
          </div>
          <p className="text-xs text-muted-foreground">Internal app logic & generation</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center items-start space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span className="text-sm font-medium text-foreground">Admin & Staff</span>
          </div>
          <p className="text-xs text-muted-foreground">Administrative entrypoints</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center items-start space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0ea5e9]" />
            <span className="text-sm font-medium text-foreground">Public Interfaces</span>
          </div>
          <p className="text-xs text-muted-foreground">Customer facing tracking</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center items-start space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
            <span className="text-sm font-medium text-foreground">Database Layer</span>
          </div>
          <p className="text-xs text-muted-foreground">Cloud storage</p>
        </div>
      </motion.div>

      {/* Mermaid Live Render */}
      <div className="w-full relative">
        <Mermaid key={key} chart={defaultChart} className="min-h-[600px] w-full bg-gradient-to-br from-background via-background to-secondary/10" />
      </div>

    </div>
  )
}
