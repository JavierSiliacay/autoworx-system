# Autoworx System

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white) ![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) ![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white) ![NextAuth](https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![Resend](https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white) ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

A professional, high-performance Vehicle Repair Management System designed for modern auto workshops. This platform integrates automotive technical expertise with advanced software engineering to provide a comprehensive management solution for workshop administrators and a seamless experience for vehicle owners.


Designed and developed by Javier Siliacay (Autotronics Student, USTP).

---

## Core Features

### Administration and Command Center
The administrative dashboard serves as the central hub for workshop operations, featuring live data synchronization and granular control over the repair lifecycle.
- **Real-time Synchronization**: Powered by Supabase Realtime, new bookings and status updates reflect across all admin sessions instantly without page refreshes.
- **Auditory and Visual Alerts**: Integrated notification system providing immediate awareness of new appointments through audio cues and floating UI notifications.
- **Appointment Lifecycle Management**: Comprehensive tools to manage appointments from initial booking through completion and archiving.

### Granular Costing and Billing
The system features a detailed costing engine that automates the financial aspects of vehicle repair.
- **Itemized Cost Breakdown**: Separate management for services, parts, and labor with flexible category assignments.
- **Automated Tax Calculations**: Built-in 12% VAT calculation logic with the ability to enable or disable as needed for specific quotes.
- **Discount Management**: Support for both fixed-amount and percentage-based discounts applied in real-time.
- **UX-Optimized Entry**: Keyboard shortcuts (e.g., Enter key to rapidly add multiple items) for efficient data entry during busy shop hours.

### Digital Authorization and E-Signatures
Professional authorization system to ensure transparency and accountability in the repair process.
- **Permission-Based Toggles**: Integrated e-signature inclusion logic for General and Operation Managers.
- **Role-Based Access Control**: Strict unauthorized access prevention; specific signatures (e.g., Paul D. Suazo or Alfred N. Agbong) can only be toggled by their respective owners or verified developers.
- **Visual Auditing**: Read-only status indicators for administrators who lack specific toggle permissions.

### Automated Reporting and Documentation
Generates professional, shop-branded documentation for both internal use and customer records.
- **Compact PDF Reports**: Optimized single-page report generation including vehicle details, comprehensive cost breakdowns, delivery estimates, and authorized signatures.
- **Automated Document Generation**: One-click "Save File" functionality to export complete appointment records.
- **Customer Portability**: Customers can download simplified appointment summaries and tracking confirmations.

### Intelligent Search and Data Normalization
Advanced search capabilities designed for accuracy in a workshop environment.
- **Format-Agnostic Matching**: The system ignores spaces, hyphens, and casing during searches (e.g., `ABC1234` matches `ABC-1234`).
- **Multi-Field Querying**: Search across plate numbers, customer names, chassis numbers, insurance providers, and engine numbers.
- **Match Visibility**: Highlighting and categorization of search results to show exactly why a record matched a query.

### Customer Engagement and AI
- **Automated Communication**: Instant booking confirmations and status updates delivered via Resend email integration.
- **Live Repair Tracking**: Specialized public portal where vehicle owners can monitor repair progress in real-time using unique tracking codes.
- **AI-Powered Assistance**: Intelligent interface on the landing page to assist customers with service inquiries and booking procedures.
- **Business Analyst AI**: Backend analytical tools for shop owners to identify revenue trends and optimize workshop performance.

---

## Technical Architecture

- **Framework**: Next.js (React 19, TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Real-time Layer**: Supabase Realtime (WebSockets)
- **Styling**: Tailwind CSS, shadcn/ui, and custom CSS animations
- **Communication**: Resend API for transactional email
- **Documentation**: jsPDF and html2canvas for PDF generation
- **Authentication**: NextAuth.js with Google OAuth integration
- **Geospatial**: OpenStreetMap and Leaflet for workshop location accuracy

---

## Installation and Setup

### Prerequisites
- Node.js 20.x or higher
- Supabase Project (with Database and Storage)
- Resend API Key
- Google Cloud Console Project (for OAuth)

### Setup Instructions
1. **Clone the Repository**
   ```bash
   git clone https://github.com/JavierSiliacay/autoworx-system.git
   cd autoworx-system
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="your_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your_secret"
   GOOGLE_CLIENT_ID="your_google_id"
   GOOGLE_CLIENT_SECRET="your_google_secret"
   
   # Resend
   RESEND_API_KEY="your_resend_key"
   ```

3. **Database Realtime Configuration**
   In the Supabase Dashboard, enable replication for the `appointments` table under Database -> Replication -> supabase_realtime.

4. **Development Server**
   ```bash
   npm run dev
   ```

---

## About the Project
The Autoworx System was developed to bridge the gap between traditional automotive repair and modern digital efficiency. By automating administrative overhead and providing transparent tracking for customers, it enables workshop staff to focus on high-quality technical service while the system handles the data.

**Autoworx: Excellence in Motion.**
