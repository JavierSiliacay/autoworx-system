import { sendAppointmentEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, name, email, trackingCode, vehicleDetails, services, status, repairStatus } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`Attempting to send ${type} email to: ${email}`);

    const response = await sendAppointmentEmail({
      type,
      name,
      email,
      trackingCode,
      vehicleDetails,
      services,
      status: status || 'Pending',
      repairStatus
    });

    if (response.error) {
      console.error('Resend API Error:', response.error);
      return NextResponse.json({ error: response.error }, { status: 500 });
    }

    console.log('Resend API Success:', response.data);
    return NextResponse.json({ success: true, data: response.data });
  } catch (err) {
    console.error('Server side email error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
