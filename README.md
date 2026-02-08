# Repair Status Management System

A modern, full-stack web application designed for professional auto repair shops to manage vehicle repair appointments, track real-time progress, and handle complex costing. Built with Next.js, React, TypeScript, and Supabase.

## 🌟 Key Updates
- **2024 Automated Email System**: Now featuring professional email notifications via Resend for both customers and staff.
- **Enhanced Documentation**: Integrated mandatory ORCR (Official Receipt/Certificate of Registration) photo uploads for better vehicle verification.

## 🚀 Features

### 🛠️ For Vehicle Owners
- **Easy Booking** - Steamlined form for booking repair appointments.
- **Required Documentation** - Direct upload of ORCR images and damage photos for faster assessment.
- **Real-time Tracking** - Track repair progress using a unique tracking code.
- **Automated Alerts** - Receive instant email confirmation of your booking and "Service Completed" notifications.
- **Responsive Interface** - Fully optimized for mobile devices, including easy-to-use photo management.

### 👨‍💼 For Admin & Staff
- **Centralized Dashboard** - Manage all active appointments and historical records in one place.
- **Automated Workflow** - Mark an appointment as **"Completed"** to automatically trigger a professional notification to the customer with pickup details.
- **Precision Tracking** - Update specific repair statuses and the exact part currently being worked on.
- **Advanced Costing** - Itemized billing for parts, labor, and services with automatic VAT (12%) and discount calculations.
- **History & Archiving** - Move completed jobs to history while maintaining full searchable records for future reference.

## 💻 Tech Stack

- **Framework**: Next.js 16 (React 19, TypeScript)
- **Styling**: Vanilla CSS + Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (ORCR & Damage image hosting)
- **Email Service**: Resend API
- **Auth**: NextAuth.js
- **Icons**: Lucide React

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm / pnpm / yarn
- Supabase Account
- Resend Account

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/JavierSiliacay/autoworx-system.git
   cd repair-status-management
   pnpm install
   ```

2. **Environment Configuration**
   Create a `.env.local` file and add the following keys:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="your_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key"
   
   # Auth
   NEXTAUTH_SECRET="your_secret"
   GOOGLE_CLIENT_ID="your_google_id"
   GOOGLE_CLIENT_SECRET="your_google_secret"
   
   # Email
   RESEND_API_KEY="your_resend_api_key"
   ```

3. **Run Locally**
   ```bash
   pnpm dev
   ```

## 📧 Email Notification Details
The system now includes professional HTML email templates for:
1. **Appointment Submission**: A detailed summary sent to the customer immediately after booking.
2. **Service Completion**: A themed notification sent automatically when an Admin updates the appointment status to "Completed", including shop location and contact details for pickup.

## 📂 Project Structure
```
app/
├── (public)/       # Booking, tracking, and info pages
├── admin/          # Secure admin dashboard
├── api/            # Serverless endpoints (Email, DB, History)
├── lib/            # Shared utilities (Email handler, constants)
components/
├── booking/        # Advanced form with photo uploads
├── ui/             # Reusable UI components
```

## 👨‍💻 About the Developer
**Javier Siliacay**  
*Autotronics Student from USTP*  
This system was built to combine automotive expertise with modern software engineering for a more efficient repair shop experience.

## ✅ Roadmap
- [x] Email notifications for appointment updates (Resend Integration)
- [x] Required ORCR Attachment support
- [ ] SMS notifications
- [ ] Invoice PDF generation
- [ ] Payment gateway integration
- [ ] Multi-shop support

---
**Built with ❤️ for the future of Automotive Service Management.**
