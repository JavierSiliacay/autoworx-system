# Appointment Form Updates - Summary

## Changes Made

### 1. Mobile-Friendly Close Button for Damage Photos
- **File**: `components/booking/booking-form.tsx`
- **Change**: Modified the close (×) button on damage photo previews to be always visible on mobile devices
- **Implementation**: Updated the button's CSS classes from `opacity-0 group-hover:opacity-100` to `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`
- **Result**: On mobile screens, the close button is always visible. On desktop (sm and larger), it only shows on hover.

### 2. Required ORCR Attachment Field
- **File**: `components/booking/booking-form.tsx`
- **Changes**:
  - Added new state variables for ORCR image handling:
    - `orcrImage`: Preview of the ORCR image
    - `orcrImageFile`: The actual file to upload
    - `isUploadingOrcr`: Loading state during upload
  - Added `handleOrcrUpload()` function to handle ORCR file selection and validation
  - Added `removeOrcrImage()` function to allow users to remove and replace the ORCR
  - Added new UI section with:
    - Clear instructions about the ORCR requirement
    - Upload area with file validation (image type, max 5MB)
    - Preview with mobile-friendly close button
    - Helpful text: "Click the × button to replace the image"
  - Updated form submission to include ORCR in the upload process
  - Modified submit button to be disabled if ORCR is not provided
  - Added `orcrImage` field to `BookingFormData` interface

### 3. Backend API Updates
- **File**: `app/api/appointments/route.ts`
- **Changes**:
  - POST endpoint: Added `orcr_image` field to database insert
  - DELETE endpoint: Added cleanup logic to remove ORCR image from storage when deleting appointments
  - Upload handling: Modified to handle both damage images and ORCR image in a single upload batch

### 4. Database Schema
- **File**: `scripts/003_add_orcr_image.sql` (NEW)
- **Purpose**: Migration script to add the `orcr_image` column to the appointments table
- **Content**: Adds a TEXT column to store the ORCR image URL

### 5. TypeScript Interface Updates
- **Files**: 
  - `app/admin/dashboard/page.tsx`
  - `app/(public)/track/page.tsx`
- **Changes**: Added `orcr_image` / `orcrImage` field to:
  - `AppointmentDB` interface (snake_case for database)
  - `Appointment` interface (camelCase for frontend)
  - `dbToFrontend()` conversion function

## What You Need to Do Next

### 1. Run the Database Migration
Execute the SQL migration script to add the `orcr_image` column to your database:

```sql
-- Run this in your Supabase SQL editor or database client
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS orcr_image TEXT;

COMMENT ON COLUMN public.appointments.orcr_image IS 'URL to the uploaded ORCR (Official Receipt/Certificate of Registration) image';
```

Or use the migration file:
```bash
# If you have a migration tool set up
psql -d your_database -f scripts/003_add_orcr_image.sql
```

### 2. Test the Changes
1. **Mobile Testing**: 
   - Open the booking form on a mobile device or use browser dev tools mobile view
   - Upload damage photos and verify the × button is always visible
   - Upload an ORCR image and verify the × button is visible

2. **ORCR Upload Testing**:
   - Try to submit the form without an ORCR (should be blocked)
   - Upload an ORCR image
   - Verify the preview shows correctly
   - Test removing and replacing the ORCR image
   - Submit the form and verify the ORCR is saved

3. **Admin Dashboard**:
   - Check that appointments show the ORCR image data
   - Verify deletion removes both damage images and ORCR from storage

## Key Features

### User Experience Improvements
1. **Mobile UX**: Users on mobile can now easily see and tap the close button to remove/replace images
2. **Clear Requirements**: Blue info box clearly states ORCR is required with helpful instructions
3. **Visual Feedback**: ORCR preview shows with a prominent border and clear labeling
4. **Validation**: Form won't submit without ORCR, preventing incomplete appointments

### Admin Benefits
1. **Required Documentation**: All appointments now include ORCR for processing
2. **Better Organization**: ORCR is separate from damage photos
3. **Storage Cleanup**: ORCR images are properly deleted when appointments are removed

## Technical Notes

- ORCR images are stored in the same Supabase storage bucket as damage images
- File size limit: 5MB
- Accepted formats: All image types (PNG, JPG, etc.)
- The ORCR is uploaded along with damage images in a single batch for efficiency
- The close button uses responsive Tailwind classes: `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`
