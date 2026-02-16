import { Resend } from 'resend';

export type EmailType = 'submission' | 'completed';

interface EmailParams {
    type: EmailType;
    name: string;
    email: string;
    trackingCode: string;
    vehicleDetails: string;
    plateNumber?: string;
    color?: string;
    insurance?: string;
    preferredDate?: string;
    services: string;
    message?: string;
    status: string;
    chassisNumber?: string;
    engineNumber?: string;
    assigneeDriver?: string;
}

export async function sendAppointmentEmail({
    type,
    name,
    email,
    trackingCode,
    vehicleDetails,
    plateNumber,
    color,
    insurance,
    preferredDate,
    services,
    message,
    status,
    chassisNumber,
    engineNumber,
    assigneeDriver
}: EmailParams) {
    console.log(`[Email Utility] Preparing to send ${type} email to: ${email}`);

    if (!process.env.RESEND_API_KEY) {
        console.error('[Email Utility] FATAL: RESEND_API_KEY is missing from environment variables');
        return { error: { message: 'Resend API Key is missing' }, data: null };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    let subject = '';
    let htmlContent = '';
    const displayStatus = status || 'Pending';

    if (type === 'completed') {
        subject = 'Your Vehicle Service is Completed ✅';
        htmlContent = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
                <div style="background-color: #1a1a1a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; letter-spacing: 2px; font-size: 24px;">AUTOWORX REPAIRS</h1>
                    <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px;">& GEN. MERCHANDISE</p>
                </div>
                
                <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
                    <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
                    
                    <p style="font-size: 16px;">Your vehicle service with <strong>Autoworx Repairs and Gen. Merchandise</strong> is now <strong>Completed ✅</strong>. Thank you for choosing our service!</p>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; font-size: 16px;">Appointment Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 6px 0; color: #666; width: 140px;">Tracking Code:</td>
                                <td style="padding: 6px 0; font-weight: bold; color: #1a1a1a;">${trackingCode}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #666;">Vehicle:</td>
                                <td style="padding: 6px 0; color: #1a1a1a;">${vehicleDetails}</td>
                            </tr>
                            ${plateNumber ? `<tr><td style="padding: 6px 0; color: #666;">Plate Number:</td><td style="padding: 6px 0; color: #1a1a1a;">${plateNumber}</td></tr>` : ''}
                            <tr>
                                <td style="padding: 6px 0; color: #666;">Services Availed:</td>
                                <td style="padding: 6px 0; color: #1a1a1a;">${services}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #666;">Status:</td>
                                <td style="padding: 6px 0; color: #2e7d32; font-weight: bold;">Completed ✅</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #2e7d32; margin-bottom: 25px;">
                        <p style="margin: 0; font-weight: bold; color: #1b5e20;">You can pick up your unit at:</p>
                        <p style="margin: 5px 0 0 0; color: #1b5e20;">Zone 7 Sepulvida Street, Kauswagan Highway, Cagayan De Oro City.</p>
                    </div>

                    <div style="margin-bottom: 25px; padding: 15px; background-color: #f0f7ff; border-radius: 8px; color: #1a5f9c; font-size: 15px;">
                        <p style="margin: 0;">We hope you're satisfied with our service! Please make sure to check your vehicle and feel free to reach out if you have any questions or concerns. Your feedback helps us improve.</p>
                    </div>
                    
                    <div style="margin: 30px 0; border-top: 1px solid #eeeeee; padding-top: 20px;">
                        <p style="margin-bottom: 10px; font-weight: bold;">Contact for inquiries:</p>
                        <p style="margin: 5px 0;"><strong>Sir Ryan (Service Advisor):</strong> 0965-918-3394</p>
                        <p style="margin: 5px 0;"><strong>Sir Paul (Service Manager):</strong> 0936-354-9603</p>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://autoworx-system.vercel.app/track?code=${trackingCode}" 
                           style="background-color: #1a1a1a; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                           Track Status Online
                        </a>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                    <p>This is an automated message. Please do not reply.</p>
                    <p>&copy; ${new Date().getFullYear()} Autoworx Repairs & Gen. Merchandise</p>
                </div>
            </div>
        `;
    } else {
        subject = 'Your Autoworx Appointment Details';
        htmlContent = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
                <div style="background-color: #1a1a1a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; letter-spacing: 2px; font-size: 24px;">AUTOWORX REPAIRS</h1>
                    <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px;">& GEN. MERCHANDISE</p>
                </div>
                
                <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
                    <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
                    
                    <p style="font-size: 16px;">Thank you for booking your vehicle service with <strong>Autoworx Repairs and Gen. Merchandise!</strong></p>
                    
                    <p>We have received your appointment request. Here are the details you submitted:</p>

                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; font-size: 16px;">Appointment Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 6px 0; color: #666; width: 140px;">Tracking Code:</td>
                                <td style="padding: 6px 0; font-weight: bold; color: #1a1a1a;">${trackingCode}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #666;">Vehicle:</td>
                                <td style="padding: 6px 0; color: #1a1a1a;">${vehicleDetails}</td>
                            </tr>
                            ${plateNumber ? `<tr><td style="padding: 6px 0; color: #666;">Plate Number:</td><td style="padding: 6px 0; color: #1a1a1a;">${plateNumber}</td></tr>` : ''}
                            ${color ? `<tr><td style="padding: 6px 0; color: #666;">Color:</td><td style="padding: 6px 0; color: #1a1a1a;">${color}</td></tr>` : ''}
                            ${insurance ? `<tr><td style="padding: 6px 0; color: #666;">Insurance:</td><td style="padding: 6px 0; color: #1a1a1a;">${insurance}</td></tr>` : ''}
                            ${preferredDate ? `<tr><td style="padding: 6px 0; color: #666;">Preferred Date:</td><td style="padding: 6px 0; color: #1a1a1a;">${preferredDate}</td></tr>` : ''}
                            <tr>
                                <td style="padding: 6px 0; color: #666;">Services Availed:</td>
                                <td style="padding: 6px 0; color: #1a1a1a;">${services}</td>
                            </tr>
                            ${assigneeDriver ? `<tr><td style="padding: 6px 0; color: #666;">Assignee/Driver:</td><td style="padding: 6px 0; color: #1a1a1a;">${assigneeDriver}</td></tr>` : ''}
                            ${chassisNumber ? `<tr><td style="padding: 6px 0; color: #666;">Chassis #:</td><td style="padding: 6px 0; color: #1a1a1a;">${chassisNumber}</td></tr>` : ''}
                            ${engineNumber ? `<tr><td style="padding: 6px 0; color: #666;">Engine #:</td><td style="padding: 6px 0; color: #1a1a1a;">${engineNumber}</td></tr>` : ''}
                            <tr>
                                <td style="padding: 6px 0; color: #666;">Status:</td>
                                <td style="padding: 6px 0; color: #fb8c00; font-weight: bold;">${displayStatus}</td>
                            </tr>
                        </table>
                        ${message ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                            <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">Your Message:</p>
                            <p style="margin: 5px 0 0 0; font-style: italic; font-size: 14px; color: #333;">"${message}"</p>
                        </div>
                        ` : ''}
                    </div>

                    <div style="background-color: #f0f7ff; padding: 15px; border-left: 4px solid #1a5f9c; margin-bottom: 25px;">
                        <p style="margin: 0; font-size: 14px;"><strong>Note:</strong> Sir Ryan (Service Advisor) or Sir Paul (HR Supervisor) will call you to assess your appointment.</p>
                    </div>
                    
                    <div style="margin: 30px 0; border-top: 1px solid #eeeeee; padding-top: 20px;">
                        <p style="margin-bottom: 10px; font-weight: bold;">We highly recommend contacting:</p>
                        <p style="margin: 5px 0;"><strong>Sir Ryan:</strong> 0965-918-3394 (For inquiries)</p>
                        <p style="margin: 5px 0;"><strong>Sir Paul:</strong> 0936-354-9603</p>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <p style="font-size: 14px; margin-bottom: 15px;">For more information or updates, visit our website:</p>
                        <a href="https://autoworx-system.vercel.app" 
                           style="background-color: #1a1a1a; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                           Visit Autoworx
                        </a>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                    <p>This is an automated message. Please do not reply.</p>
                    <p>&copy; ${new Date().getFullYear()} Autoworx Repairs & Gen. Merchandise</p>
                </div>
            </div>
        `
    }

    console.log(`[Email Utility] Executing resend.emails.send for: ${email}`);

    return await resend.emails.send({
        from: 'onboarding@resend.dev',//from: "Autoworx System <notifications@yourdomain.com>"
        to: email, // Changed from array [email] to string email to match working test
        subject: subject,
        html: htmlContent,
    });
}
