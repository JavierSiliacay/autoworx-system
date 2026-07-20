import { NextResponse } from "next/server"
import { Resend } from "resend"
import { getToken } from "next-auth/jwt"
import { isAuthorizedAdminEmail, isDeveloperEmail } from "@/lib/auth"
import { PRODUCTION_URL } from "@/lib/constants"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      appointmentId,
      clientEmail,
      clientName,
      trackingCode,
      vehicleDetails,
      message,
      pdfBase64,
      pdfFilename,
      subject,
      plateNumber,
      vehicleColor,
      insurance,
      serviceType,
      serviceAdvisor,
    } = await request.json()

    if (!clientEmail || !pdfBase64 || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Strip the "data:...base64," prefix safely
    const base64Data = pdfBase64.includes("base64,") ? pdfBase64.split("base64,")[1] : pdfBase64

    const data = await resend.emails.send({
      from: 'Autoworx Repairs <notifications@autoworxcagayan.com>',
      to: clientEmail,
      cc: ['autoworxcagayan2025@gmail.com', 'paulsuazo64@gmail.com'],
      subject: subject || `Repair Estimate - Autoworx [${trackingCode}]`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #eee; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <img src="${PRODUCTION_URL}/autoworxlogo.png" alt="Autoworx Logo" style="width: 100px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />
              <h1 style="color: #ffffff; margin: 0; letter-spacing: 2px; font-size: 24px;">AUTOWORX REPAIRS</h1>
              <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px;">&amp; GEN. MERCHANDISE</p>
          </div>
          <div style="padding: 30px; color: #333; line-height: 1.6;">
            <h2 style="color: #dc2626; margin-top: 0; margin-bottom: 20px;">Repair Estimate</h2>
            <div style="margin-bottom: 24px; white-space: pre-wrap;">${message}</div>
            <table style="width: 100%; background-color: #f8fafc; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e2e8f0; border-spacing: 0;">
              <tr>
                <td style="padding: 15px 15px 5px 15px; vertical-align: top; width: 50%;">
                  <p style="margin: 0 0 10px 0;"><strong>Client Name:</strong> ${clientName}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Tracking Code:</strong> ${trackingCode}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Vehicle:</strong> ${vehicleDetails}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Plate Number:</strong> ${plateNumber}</p>
                </td>
                <td style="padding: 15px 15px 5px 15px; vertical-align: top; width: 50%;">
                  <p style="margin: 0 0 10px 0;"><strong>Color:</strong> ${vehicleColor}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Insurance:</strong> ${insurance}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Service Type:</strong> ${serviceType}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Service Advisor:</strong> ${serviceAdvisor}</p>
                </td>
              </tr>
            </table>
            
            <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
                <a href="${PRODUCTION_URL}/track?code=${trackingCode}" 
                   style="background-color: #dc2626; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                   Track Your Vehicle Online
                </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              This is an automated message from the Autoworx Management System. Please see the attached PDF for the full repair estimate.<br><br>
              For more information, visit our website at <a href="${PRODUCTION_URL}" style="color: #dc2626; text-decoration: none; font-weight: bold;">autoworxcagayan.com</a>
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: pdfFilename || `Estimate_${trackingCode}.pdf`,
          content: base64Data,
        }
      ]
    });

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error sending estimate email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
