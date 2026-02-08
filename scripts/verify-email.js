const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    console.log('Testing Resend with API Key:', process.env.RESEND_API_KEY?.substring(0, 5) + '...');

    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'javiersiliacaysiliacay1234@gmail.com', // Using the email found in previous files
            subject: 'Test Email from Autoworx System',
            html: '<p>This is a test email to verify Resend configuration.</p>'
        });

        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent successfully!', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testEmail();
