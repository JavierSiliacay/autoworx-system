# Autoworx System 🚗💨

A modern, high-performance **Vehicle Repair Management System** designed for professional auto workshops. This system bridges the gap between automotive expertise and cutting-edge software engineering, providing a seamless experience for both shop owners and vehicle owners.

Built by **Javier Siliacay** (Autotronics Student, USTP).

---

## 🌟 Key Features (Latest Updates)

### ⚡ **Real-time Admin Dashboard**
The command center now features **live data synchronization** powered by Supabase Realtime.
- **Instant Updates**: New bookings appear automatically without page refreshes.
- **Audio Notifications**: A professional "ding" sound alert for immediate shop awareness.
- **Heads-up Toasts**: Floating notifications for new appointments and status changes.

### 🔍 **Advanced Intelligent Search**
Finding customer records is now faster and more forgiving than ever.
- **Normalized Matching**: Ignores spaces, casing, and common separators (e.g., `ASD3156` matches `ASD-3156`).
- **Flexible Search**: Works across names, emails, phone numbers, plate numbers, vehicle models, and even customer messages.
- **Partial Support**: Find records even if you only remember a fragment of the input.

### 🛡️ **Premium Booking Experience**
A re-engineered form validation system to ensure high-quality data.
- **Visual Validation**: Required fields highlight in red with helpful inline messages.
- **Smart Scrolling**: Automatically scrolls to the first error if a submission fails.
- **Required Documentation**: Mandatory ORCR (Official Receipt/Certificate of Registration) upload to verify vehicle ownership.

---

## �️ Features

### **For Vehicle Owners**
- **Sleek Booking Form**: Mobile-optimized interface for scheduling repairs.
- **Photo Attachments**: Upload up to 5 damage photos + ORCR document.
- **Instant Tracking**: Check repair status anytime using a unique tracking code.
- **Automated Alerts**: Professional confirmation emails sent via **Resend**.
- **PDF Confirmation**: Download a formatted summary of your appointment.

### **For Admin & Staff**
- **Command Center**: Manage appointments, update repair progress (Parts, Labor), and set estimated costs.
- **Automated Billing**: Itemized costing with automatic VAT (12%) and discount calculations.
- **History Archiving**: Seamlessly move completed jobs to a searchable history database.
- **Analytics**: Built-in **Vercel Analytics** to track site traffic and customer behavior.

---

## 💻 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (React 19, TypeScript)
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

## � Architecture
```
autoworx-system/
├── app/            # Next.js App Router (Admin, Public, API)
├── components/     # UI Components (Booking, Dashboard, AI)
├── lib/            # Utilities (Email, PDF, Auth, Phone Formatting)
├── public/         # Static assets (Logo, Notification sounds)
└── scripts/        # Database migration SQL files
```

---

## ✅ Project Roadmap
- [x] Real-time Admin Dashboard
- [x] Advanced Search Filtering
- [x] Enhanced Form Validation
- [x] Vercel Analytics Integration
- [ ] PWA Support (Add to Home Screen)
- [ ] AI-Powered Vehicle Damage Assessment (Vision)
- [ ] SMS Gateway for Appointment Updates

---
**Built with ❤️ for the future of Automotive Service Management.**  
*Autoworx: Excellence in Motion.*
