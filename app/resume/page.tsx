import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions, isDeveloperEmail } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { 
  Mail, Phone, MapPin, Linkedin, Github, 
  Printer, ArrowLeft, Globe,
  Code2, Cpu, Award, GraduationCap, Briefcase, Eye, ShieldCheck, Zap,
  Target, Layers
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ResumePage() {
  const session = await getServerSession(authOptions)
  
  // Security: Only allow authorized developers
  if (!session || !isDeveloperEmail(session.user?.email)) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white print:overflow-hidden">
        {/* Navigation Bar - Hidden on print */}
        <nav className="bg-white border-b px-4 py-3 sticky top-0 z-50 print:hidden">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <Link href="/admin/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 border-slate-200"
                    >
                        <Printer className="w-4 h-4" />
                        Use Ctrl+P to Print (A4)
                    </Button>
                </div>
            </div>
        </nav>

        {/* Main Resume Container */}
        <main className="max-w-5xl mx-auto my-8 print:my-0 print:mx-0 print:max-w-none print:w-full">
            <div className="bg-white shadow-2xl border-t-[12px] border-[#800000] print:shadow-none print:border-none print:h-screen print:flex print:flex-col">
                
                {/* HEADER SECTION */}
                <header className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-6 print:p-8 print:pb-5 print:border-b-2">
                    <div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2 print:text-4xl">
                            Javier G. Siliacay
                        </h1>
                        <h2 className="text-2xl font-bold text-[#800000] mb-6 print:text-xl print:mb-3">
                            Full-Stack Developer & IoT Engineer
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-12 text-sm font-medium text-slate-500 print:text-[11px] print:gap-y-1">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400 print:w-3.5 print:h-3.5" />
                                <span>siliacay.javier@gmail.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400 print:w-3.5 print:h-3.5" />
                                <span>+63 997 837 9342</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 print:w-3.5 print:h-3.5" />
                                <span>Osmeña Ext. Brgy 26, Cagayan de Oro City</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-2 print:mt-1.5 print:gap-0.5">
                                <span className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px] print:text-[9px]">
                                    <Linkedin className="w-3.5 h-3.5 print:w-3 print:h-3" />
                                    <span>linkedin.com/in/javier-siliacay-37910b3bb</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] print:text-[9px]">
                                    <Github className="w-3.5 h-3.5 print:w-3 print:h-3" />
                                    <span>github.com/javiersiliacay</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px] print:text-[9px]">
                                    <Globe className="w-3.5 h-3.5 print:w-3 print:h-3" />
                                    <span>javiersiliacay.vercel.app</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block print:hidden">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Stack Level</p>
                            <Badge className="bg-[#800000] hover:bg-[#600000] text-white border-none px-4 py-1">Full-Stack + IoT</Badge>
                        </div>
                    </div>
                </header>

                {/* TWO-COLUMN CONTENT */}
                <div className="grid grid-cols-12 flex-1">
                    
                    {/* LEFT COLUMN: EXPERIENCE & PROJECTS */}
                    <div className="col-span-12 md:col-span-8 p-10 border-r border-slate-100 print:col-span-8 print:p-7 print:pr-10">
                        
                        {/* SUMMARY */}
                        <section className="mb-8 print:mb-6">
                            <div className="flex items-center gap-3 mb-4 border-b-2 border-slate-900 pb-2 print:mb-3 print:pb-1.5">
                                <Target className="w-5 h-5 text-[#800000] print:w-4 print:h-4" />
                                <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 print:text-base">Professional Summary</h3>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed print:text-[11px] print:leading-normal">
                                Innovative <strong>Full-Stack Developer and IoT Engineer</strong> specialized in architecting seamless bridges between web infrastructures and physical hardware. Proven expertise in building <strong>AI-integrated diagnostic platforms</strong>, real-time telemetry systems, and autonomous firmware flashing tools. Dedicated to merging <strong>Next.js ecosystems</strong> with <strong>embedded electronics</strong> to drive industrial and automotive innovation.
                            </p>
                        </section>

                        {/* EXPERIENCE */}
                        <section className="mb-8 print:mb-6">
                            <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-900 pb-2 print:mb-4 print:pb-1.5">
                                <Briefcase className="w-5 h-5 text-[#800000] print:w-4 print:h-4" />
                                <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 print:text-base">Work Experience</h3>
                            </div>

                            {/* Autoworx Ecosystem */}
                            <div className="mb-8 print:mb-5">
                                <div className="flex justify-between items-start mb-1 print:mb-0.5">
                                    <h4 className="text-lg font-bold text-slate-900 print:text-sm">Full-Stack Lead Developer</h4>
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded print:text-[9px]">2026 — CURRENT</span>
                                </div>
                                <div className="text-[#800000] font-black mb-3 uppercase tracking-widest text-[11px] print:text-[10px] print:mb-2">Autoworx System (autoworxcagayan.com)</div>
                                <ul className="space-y-1.5 print:space-y-1">
                                    <li className="text-sm text-slate-600 flex gap-2 print:text-[10px]">
                                        <span className="text-[#800000] font-bold">•</span>
                                        <span>Architected and deployed a full-scale vehicle service management system using <strong>Next.js 16</strong> and <strong>Supabase</strong> for core operations.</span>
                                    </li>
                                    <li className="text-sm text-slate-600 flex gap-2 print:text-[10px]">
                                        <span className="text-[#800000] font-bold">•</span>
                                        <span>Integrated a custom <strong>AI Diagnostics Engine</strong> and automated financial tracking, reducing report generation time by <strong>40%</strong>.</span>
                                    </li>
                                    <li className="text-sm text-slate-600 flex gap-2 print:text-[10px]">
                                        <span className="text-[#800000] font-bold">•</span>
                                        <span>Designed and maintained <strong>15+ modular UI components</strong> ensuring a mobile-responsive experience for staff and customers.</span>
                                    </li>
                                    <li className="text-sm text-slate-600 flex gap-2 print:text-[10px]">
                                        <span className="text-[#800000] font-bold">•</span>
                                        <span>Analyzed and implemented secure server-side authorization patterns to safeguard sensitive business data.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Robotics Roles */}
                            <div className="mb-8 print:mb-5">
                                <div className="flex justify-between items-start mb-1 print:mb-0.5">
                                    <h4 className="text-lg font-bold text-slate-900 print:text-sm">Robotics Mentor & Trainer</h4>
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded print:text-[9px]">2024 — 2025</span>
                                </div>
                                <div className="text-[#800000] font-black mb-3 uppercase tracking-widest text-[11px] print:text-[10px] print:mb-2">USTP College of Technology Extension</div>
                                <ul className="space-y-1.5 print:space-y-1">
                                    <li className="text-sm text-slate-600 flex gap-2 print:text-[10px]">
                                        <span className="text-[#800000] font-bold">•</span>
                                        <span>Mentored <strong>20+ student teams</strong> in designing and programming competitive robots for the <strong>National Robotics Competition (NRC) 2025</strong>.</span>
                                    </li>
                                    <li className="text-sm text-slate-600 flex gap-2 print:text-[10px]">
                                        <span className="text-[#800000] font-bold">•</span>
                                        <span>Engineered and delivered hardware assembly training on <strong>Arduino</strong> and <strong>ESP32</strong> for the USTP Summer Camp Program.</span>
                                    </li>
                                    <li className="text-sm text-slate-600 flex gap-2 print:text-[10px]">
                                        <span className="text-[#800000] font-bold">•</span>
                                        <span>Optimized line-following and obstacle-avoidance logic, significantly improving student team performance in competitions.</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* TOP PROJECTS */}
                        <section className="mb-0">
                            <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-900 pb-2 print:mb-4 print:pb-1.5">
                                <Layers className="w-5 h-5 text-[#800000] print:w-4 print:h-4" />
                                <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 print:text-base">Selected Technical Projects</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6 print:gap-4">
                                <div>
                                    <h4 className="text-md font-bold text-slate-900 flex items-center gap-2 print:text-sm">
                                        TaraFix <span className="text-[10px] font-medium text-slate-400">| Next.js, Leaflet, React 19</span>
                                    </h4>
                                    <p className="text-sm text-slate-600 mt-1 print:text-[10px]">
                                        Spearheaded development of a real-time mechanics locator serving the Philippines, integrating complex geospatial tracking and interactive mapping.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-md font-bold text-slate-900 flex items-center gap-2 print:text-sm">
                                        Sadbai AI <span className="text-[10px] font-medium text-slate-400">| GenAI, RAG Pipelines, LangChain</span>
                                    </h4>
                                    <p className="text-sm text-slate-600 mt-1 print:text-[10px]">
                                        A private emotional companion built in a <strong>24-hour speedrun development</strong> with no login and no judgment, designed to help users express emotions like stress, heartbreak, or overthinking while helping them better understand what they feel.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-md font-bold text-slate-900 flex items-center gap-2 print:text-sm">
                                        Circuito AI <span className="text-[10px] font-medium text-slate-400">| Next.js 16, Web Serial API, Monaco Editor</span>
                                    </h4>
                                    <div className="text-sm text-slate-600 mt-1 print:text-[10px]">
                                        <p>Architected a browser-based hardware IDE featuring an <strong>Automotive Diagnostic Station</strong> with real-time serial telemetry and <strong>Autonomous Link</strong> firmware flashing via Web Serial API.</p>
                                        <p className="mt-1">Integrated a resident <strong>AI Specialist</strong> for automated fault analysis and industrial insights directly from live sensor data buffers.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR */}
                    <div className="col-span-12 md:col-span-4 bg-slate-50/50 p-10 print:col-span-4 print:p-7 print:bg-transparent">
                        
                        {/* EDUCATION */}
                        <section className="mb-10 print:mb-8">
                            <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-900 pb-2 print:mb-4 print:pb-1">
                                <GraduationCap className="w-5 h-5 text-[#800000] print:w-4 print:h-4" />
                                <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 print:text-xs">Education</h3>
                            </div>
                            <div className="mb-6 print:mb-4">
                                <p className="text-sm font-bold text-slate-900 print:text-[10px] leading-tight">BS in Autotronics</p>
                                <p className="text-[11px] text-[#800000] font-black uppercase tracking-tighter mt-1 print:text-[8px] print:mt-0.5">
                                    University of Science and Technology of Southern Philippines
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold print:text-[8px]">2022 — 2026</p>
                                <p className="text-[10px] text-slate-500 font-bold print:text-[8px]">Dean’s Lister – 1st Semester, A.Y. 2024–2025</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm print:p-3 print:border-2 mb-4">
                                <p className="text-xs font-bold text-slate-900 leading-tight mb-1 print:text-[10px]">Lead Developer of the Thesis Project</p>
                                <p className="text-[9px] font-medium italic text-[#800000] mb-2 print:text-[8px]">Univ. of Aizu, Japan | June 27–29, 2025</p>
                                <p className="text-[10px] text-slate-600 font-bold mb-2 leading-tight print:text-[8px]">
                                    “Real-Time Monitoring of Engine Oil Contamination Using an ESP32-Based Web Server and Turbidity Sensing System” (Published)
                                </p>
                                <p className="text-[9px] text-slate-500 leading-relaxed print:text-[7.5px]">
                                    Presented at the ICFSS-DLIIMST-ICSES-ICSSE 2025 International Conference.
                                </p>
                            </div>
                            <div className="mb-4">
                                <p className="text-[11px] font-bold text-slate-900 print:text-[10px]">Technical-Vocational-Livelihood (TVL) track</p>
                                <p className="text-[10px] text-slate-500 print:text-[9px]">Lapasan National High | 2016—2022</p>
                            </div>
                        </section>

                        {/* SKILLS CATEGORIZED */}
                        <section className="mb-10 print:mb-8">
                            <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-900 pb-2 print:mb-4 print:pb-1">
                                <Code2 className="w-5 h-5 text-[#800000] print:w-4 print:h-4" />
                                <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 print:text-xs">Technical Arsenal</h3>
                            </div>
                            <div className="space-y-4 print:space-y-3">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Web & AI</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['Next.js', 'React 19', 'Supabase', 'PostgreSQL', 'LangChain', 'OpenCV'].map(s => (
                                            <Badge key={s} variant="outline" className="text-[10px] font-bold border-slate-400 text-slate-950 bg-white px-2 py-0.5">
                                                {s}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Hardware & IoT</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['ESP32', 'Arduino', 'C++', 'MediaPipe', 'MQTT', 'nRF24L01'].map(s => (
                                            <Badge key={s} variant="outline" className="text-[10px] font-bold border-slate-400 text-slate-950 bg-white px-2 py-0.5">
                                                {s}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* HONORS */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-900 pb-2 print:mb-4 print:pb-1">
                                <Award className="w-5 h-5 text-[#800000] print:w-4 print:h-4" />
                                <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 print:text-xs">Recognition</h3>
                            </div>
                            <ul className="space-y-4 print:space-y-3">
                                <li className="flex flex-col gap-1">
                                    <div className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-2 print:text-[9px]">
                                        <ShieldCheck className="w-3 h-3 text-[#800000]" />
                                        DICT Cybersecurity Award 2025
                                    </div>
                                    <p className="text-[10px] text-slate-700 font-medium ml-5 leading-tight print:text-[9px]">
                                        Region 10 Awareness Video Competition: "Protect Yourself from Rising Threats of Technology"
                                    </p>
                                </li>
                                <li className="flex flex-col gap-1">
                                    <div className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-2 print:text-[9px]">
                                        <Cpu className="w-3 h-3 text-[#800000]" />
                                        National Robotics Competition 2024
                                    </div>
                                    <p className="text-[10px] text-slate-700 font-medium ml-5 leading-tight print:text-[9px]">
                                        Active participant in robotics innovation and collaborative teamwork.
                                    </p>
                                </li>
                                <li className="flex flex-col gap-1">
                                    <div className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-2 print:text-[9px]">
                                        <Eye className="w-3 h-3 text-[#800000]" />
                                        Published IoT Researcher
                                    </div>
                                    <p className="text-[10px] text-slate-700 font-medium ml-5 leading-tight print:text-[9px]">
                                        Lead Developer for the 2025 International Research Presentation in Japan.
                                    </p>
                                </li>
                            </ul>
                        </section>

                    </div>
                </div>

                {/* FOOTER */}
                <footer className="p-6 bg-slate-900 text-center print:bg-white print:p-4 print:mt-auto">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 print:text-slate-300 print:text-[9px]">
                        Architected by Javier Siliacay Talent Engine
                    </p>
                </footer>
            </div>
        </main>

        <style dangerouslySetInnerHTML={{ __html: `
            @media print {
                nav { display: none !important; }
                body { background: white !important; height: auto !important; overflow: visible !important; }
                @page { size: A4; margin: 1cm; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
        ` }} />
    </div>
  )
}
