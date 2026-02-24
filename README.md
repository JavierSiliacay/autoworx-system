# Autoworx System 🚗💨

A modern, high-performance **Vehicle Repair Management System** designed for professional auto workshops. This system bridges the gap between automotive expertise and cutting-edge software engineering, providing a seamless experience for both shop owners and vehicle owners.

Built by **Javier Siliacay** (Autotronics Student, USTP).

---

## 🌟 Key Features

### 🤖 **AI Integration (The Future of Repair)**
- **AI Mini-Chatbot**: A 24/7 intelligent assistant on the landing page that helps customers with booking, explains repair services, and answers common vehicle maintenance questions.
- **Business Analyst AI**: A specialized dashboard for Admins that analyzes workshop performance, identifies revenue trends, and provides data-driven recommendations for business growth.

### ⚡ **Real-time Admin Dashboard**
The command center features **live data synchronization** powered by Supabase Realtime.
- **Instant Updates**: New bookings appear automatically without page refreshes.
- **Audio Notifications**: A professional "ding" sound alert for immediate shop awareness.
- **Heads-up Toasts**: Floating notifications for new appointments and status changes.

### 🔍 **Advanced Intelligent Search**
Finding customer records is now faster and more forgiving than ever.
- **Normalized Matching**: Ignores spaces, casing, and common separators (e.g., `ASD3156` matches `ASD-3156`).
- **Flexible Search**: Works across names, emails, phone numbers, plate numbers, and vehicle models.

### 🛡️ **Premium Booking Experience**
A re-engineered form validation system to ensure high-quality data.
- **Visual Validation**: Required fields highlight in red with helpful inline messages.
- **Smart Scrolling**: Automatically scrolls to the first error if a submission fails.
- **Document Verification**: Mandatory ORCR attachment for secure vehicle identity.

---

## 🛠️ Features

### **For Vehicle Owners**
- **AI-Powered Support**: Instant answers to common repair questions while booking.
- **Sleek Booking Form**: Mobile-optimized interface with photo management.
- **Instant Tracking**: Check repair status anytime using a unique tracking code.
- **Automated Alerts**: Professional confirmation emails sent via **Resend**.
- **PDF Confirmation**: Download a formatted summary of your appointment.

### **For Admin & Staff**
- **Business Analyst AI**: Get insights on your busiest days and most popular services.
- **Command Center**: Manage appointments, update repair progress (Parts, Labor), and set estimated costs.
- **Automated Billing**: Itemized costing with automatic VAT (12%) calculations.
- **History Archiving**: Seamlessly move completed jobs to a searchable history database.
- **Analytics**: Built-in **Vercel Analytics** to track site traffic and customer behavior.

---

## 💻 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (React 19, TypeScript)
- **AI Models**: Integration for intelligent chat and business analysis.
- **Database & Realtime**: [Supabase](https://supabase.com/) (PostgreSQL + WebSockets)
- **Styling**: Tailwind CSS + shadcn/ui + Vanilla CSS Animations
- **Email**: [Resend](https://resend.com/)
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)
- **Auth**: [NextAuth.js](https://next-auth.js.org/) (Google OAuth)

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18.17+
- A Supabase Project (Database + Storage enabled)
- A Resend API Key

### Quick Start
1. **Clone & Install**
   ```bash
   git clone https://github.com/JavierSiliacay/autoworx-system.git
   cd autoworx-system
   npm install
   ```

2. **Environment Variables** (`.env.local`)
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
   
   # NextAuth
   NEXTAUTH_SECRET="your_secret_string"
   GOOGLE_CLIENT_ID="your_google_id"
   GOOGLE_CLIENT_SECRET="your_google_secret"
   
   # Resend
   RESEND_API_KEY="your_resend_key"
   ```

3. **Database Configuration**
   Enable **Realtime** for the `appointments` table in your Supabase Dashboard:
   `Database` -> `Publications` -> `supabase_realtime` -> Toggle `appointments` ON.

4. **Launch**
   ```bash
   npm run dev
   ```

---

## 👨‍💻 About the Developer
**Javier Siliacay**  
*Autotronics Student from USTP*  
This system was built to combine automotive expertise with modern software engineering, creating a more efficient and data-driven repair shop experience.

---
**Built with ❤️ for the future of Automotive Service Management.**  
*Autoworx: Excellence in Motion.*

