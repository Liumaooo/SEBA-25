const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send forgot password email
const sendForgotPasswordEmail = async (email, newPassword) => {
  const mailOptions = {
    from: 'catconnect2025@gmail.com',
    to: email,
    subject: 'Cat Connect - Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Cat Connect - Password Reset</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Cat Connect account.</p>
        <p>Your new temporary password is: <strong style="background-color: #f0f0f0; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${newPassword}</strong></p>
        <p>Please log in with this temporary password and change it to a new password of your choice.</p>
        <p>Best regards,<br>The Cat Connect Team</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email: ', error);
    return { success: false, error: error.message };
  }
};

// Function to send report email to admin
const sendReportEmail = async ({ reporterId, reportedUserId, reportedCatId, reason, details, timestamp }) => {
  const adminEmail = 'catconnect2025@gmail.com';
  const mailOptions = {
    from: 'catconnect2025@gmail.com',
    to: adminEmail, // <<<--- Send to a defined admin email
    subject: 'Cat Connect - New User/Cat Report',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Report Submitted</h2>
        <p><strong>Reporter ID:</strong> ${reporterId}</p>
        <p><strong>Reported User ID:</strong> ${reportedUserId}</p>
        <p><strong>Reported Cat ID:</strong> ${reportedCatId || 'N/A'}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Details:</strong> ${details || 'No additional details.'}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">This is an automated message, please check the admin dashboard for more details.</p>
      </div>
    `
  };

  try {
        await transporter.sendMail(mailOptions);
        console.log('Report email sent successfully to admin');
        return { success: true };
    } catch (error) {
        console.error('Error sending report email:', error);
        return { success: false, error: error.message };
    }
};

// Function for sending account verification email
const sendVerificationEmail = async (toEmail, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Cat Connect: Verify Your Account',
        html: `
            <p>Thank you for registering with Cat Connect!</p>
            <p>Please use the following code to verify your account:</p>
            <h3>${code}</h3>
            <p>This code is valid for 10 minutes.</p>
            <p>If you did not register for Cat Connect, please ignore this email.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully to', toEmail);
        return { success: true };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, error: error.message };
    }
};


// Function to receive shelter status request
const sendShelterStatusRequest = async ({ shelterName, shelterAddress, representativeName, phone, email, additional, userId }) => {
  const mailOptions = {
    from: 'catconnect2025@gmail.com',
    to: 'catconnect2025@gmail.com',
    subject: 'Cat Connect - New Non-Profit Shelter Status Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Non-Profit Shelter Status Request</h2>
        <p><strong>Shelter name:</strong> ${shelterName}</p>
        <p><strong>Shelter address:</strong> ${shelterAddress}</p>
        <p><strong>Representative name:</strong> ${representativeName}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Additional info:</strong> ${additional || 'None'}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">This is an automated message, please check the admin dashboard for more details.</p>
      </div>
    `
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Shelter status request email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending shelter status request email: ', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendForgotPasswordEmail,
  sendReportEmail,
  sendShelterStatusRequest,
  sendVerificationEmail
}; 
