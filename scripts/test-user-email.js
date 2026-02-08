const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testTargetEmail() {
    const targetEmail = 'siliacay.javier@gmail.com';
    console.log(`Testing Resend for specific user email: ${targetEmail}`);

    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: targetEmail,
            subject: 'Autoworx System Connection Test',
            html: `
        <h1>Connection Success!</h1>
        <p>This email confirms that the Autoworx system can reach <strong>${targetEmail}</strong> successfully using your Resend API Key.</p>
        <p>If you received this, the backend configuration is correct.</p>
      `
        });

        if (error) {
            console.error('Resend API Error:', error);
        } else {
            console.log('Email sent successfully! ID:', data.id);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testTargetEmail();
