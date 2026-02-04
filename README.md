# Repair Status Management System

A modern web application for managing vehicle repair appointments, tracking repair progress, and costing. Built with Next.js, React, TypeScript, and Supabase.

## Features

### 🛠️ For Vehicle Owners
- **Easy Booking** - Book repair appointments with vehicle information
- **Real-time Tracking** - Track your repair progress with a unique tracking code
- **Damage Documentation** - Upload photos of vehicle damage
- **Service History** - View past repair appointments and costs
- **Responsive Design** - Works on desktop, tablet, and mobile

### 👨‍💼 For Admin/Staff
- **Appointment Dashboard** - View all pending and completed appointments
- **Repair Tracking** - Update repair status and current part being repaired
- **Custom Part Input** - Enter exact parts being repaired (not limited to predefined options)
- **Cost Management** - Add itemized costs, track discounts and VAT
- **Advanced Filtering** - Search by tracking code, name, email, phone, plate, or vehicle make
- **History Records** - Archive and view completed repairs with full cost breakdowns
- **Export Options** - Generate PDF confirmations for customers

## Tech Stack

- **Frontend**: Next.js 16 (React 19, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (image uploads)
- **Authentication**: Row Level Security (RLS) policies
- **PDF Generation**: Custom PDF library
- **Build Tool**: Turbopack (Next.js native)

## Getting Started

### Prerequisites
- Node.js 18+ or higher
- pnpm (or npm/yarn)
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/repair-status-management.git
cd repair-status-management
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"

SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_JWT_SECRET="your_jwt_secret"
SUPABASE_SECRET_KEY="your_secret_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

POSTGRES_URL="your_postgres_url"
POSTGRES_PRISMA_URL="your_prisma_url"
POSTGRES_URL_NON_POOLING="your_non_pooling_url"
```

4. **Set up database schema**

Run the SQL scripts in your Supabase dashboard:
- `scripts/001_create_appointments.sql` - Creates appointments table
- `scripts/002_create_storage.sql` - Creates storage bucket for images

5. **Start development server**
```bash
pnpm dev
```

Visit http://localhost:3000

## Project Structure

```
repair-status-management/
├── app/
│   ├── (public)/           # Public routes (booking, tracking, services, about, contact)
│   ├── admin/              # Admin dashboard routes
│   ├── api/                # API routes (appointments, history, uploads)
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/
│   ├── booking/            # Booking form component
│   ├── home/               # Home page sections
│   ├── layout/             # Header, footer
│   ├── theme-provider.tsx  # Theme configuration
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/
│   ├── constants.ts        # App constants (vehicle brands, services, repair parts)
│   ├── appointment-tracking.ts
│   ├── generate-pdf.tsx    # PDF generation
│   ├── phone-format.ts     # Phone number formatting
│   ├── utils.ts            # Utility functions
│   └── supabase/           # Supabase client setup
├── scripts/                # SQL migration scripts
├── public/                 # Static assets
└── styles/                 # CSS styles
```

## Usage

### For Customers

1. Navigate to home page
2. Click "Book an Appointment" 
3. Fill in vehicle information
4. Select service type and preferred date
5. Upload damage photos (optional)
6. Submit booking
7. Receive tracking code via email
8. Use tracking code to check repair status

### For Admin

1. Navigate to `/admin` dashboard
2. View all pending appointments
3. Click an appointment to expand details
4. Update repair status and current part
5. Add itemized costs (services, parts, labor)
6. Set discount and VAT rates
7. Archive completed appointments

## API Routes

### Appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments` - List appointments
- `PUT /api/appointments` - Update appointment
- `DELETE /api/appointments` - Delete appointment

### History
- `GET /api/history` - Get archived appointments
- `POST /api/history` - Archive appointment

### Upload
- `POST /api/upload` - Upload damage images

## Features in Detail

### Custom Vehicle Make Input
Instead of selecting "Other", customers can now type their vehicle brand directly in the booking form.

### Custom Repair Part Input
Admins can enter exact parts being repaired instead of generic "Other" category for better accuracy.

### Cost Tracking
- Itemized services and parts
- Discount support (percentage or fixed amount)
- VAT calculation (12% default)
- Total cost calculation and display

### History Management
- Search by tracking code, name, email, phone, plate, or make
- Filter by service type and date range
- Sort by latest, oldest, status, or name
- View full cost breakdowns for archived records

## Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables
5. Deploy

### Other Platforms
- Netlify
- Railway
- Render
- DigitalOcean App Platform

## Environment Variables

All sensitive information should be stored in `.env.local` and never committed to version control. The file is automatically ignored by Git.

**Note**: `.env.local` is in `.gitignore` - set environment variables directly in your hosting platform's dashboard.

## Database Schema

### appointments table
- `id` (UUID) - Primary key
- `tracking_code` (TEXT) - Unique tracking code
- `name`, `email`, `phone` - Customer info
- `vehicle_make`, `vehicle_model`, `vehicle_year`, `vehicle_plate` - Vehicle info
- `service` - Service type
- `preferred_date` - Appointment date
- `message` - Additional notes
- `status` - Appointment status (pending/contacted/completed)
- `repair_status` - Current repair status
- `current_repair_part` - Part being repaired
- `costing` (JSONB) - Cost breakdown
- `damage_images` (TEXT[]) - Image URLs
- `created_at`, `updated_at` - Timestamps

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For support, please open an issue on GitHub or contact the project maintainer.

## About the Developer

**Developer:** Javier Siliacay  
**Program:** Autotronics from USTP

## Roadmap

- [ ] Email notifications for appointment updates
- [ ] SMS notifications
- [ ] Multi-language support
- [ ] Staff scheduling
- [ ] Invoice generation
- [ ] Payment integration
- [ ] Mobile app

---

**Built with ❤️ for efficient repair shop management**
