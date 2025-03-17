import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Generic function to send emails
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} [html] - Optional HTML body
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - Password reset token
 */
export const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';
  const text = `To reset your password, click the following link: ${resetUrl}`;
  const html = `
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
  `;

  return sendEmail({
    to,
    subject,
    text,
    html
  });
};

/**
 * Send welcome email to new users
 * @param {string} to - Recipient email address
 * @param {string} firstName - User's first name
 */
export const sendWelcomeEmail = async (to, firstName) => {
  const subject = 'Welcome to Beta Tech Support';
  const text = `Welcome ${firstName}! Thank you for joining Beta Tech Support.`;
  const html = `
    <h2>Welcome to Beta Tech Support</h2>
    <p>Hello ${firstName},</p>
    <p>Thank you for joining Beta Tech Support. We're excited to have you on board!</p>
  `;

  return sendEmail({
    to,
    subject,
    text,
    html
  });
};

/**
 * Send a ticket notification email
 * @param {string} to - Recipient email address
 * @param {string} ticketNumber - Ticket number
 * @param {string} message - Notification message
 */
export const sendTicketNotification = async (ticket, recipient) => {
  const subject = `New Ticket: ${ticket.title}`;
  const text = `A new ticket has been created:\n\nTitle: ${ticket.title}\nDescription: ${ticket.description}\nPriority: ${ticket.priority}`;
  const html = `
    <h2>New Ticket Created</h2>
    <p><strong>Title:</strong> ${ticket.title}</p>
    <p><strong>Description:</strong> ${ticket.description}</p>
    <p><strong>Priority:</strong> ${ticket.priority}</p>
  `;

  return sendEmail({
    to: recipient.email,
    subject,
    text,
    html
  });
};

export const sendTicketUpdateNotification = async (ticket, recipient) => {
  const subject = `Ticket Update: ${ticket.title}`;
  const text = `Your ticket has been updated:\n\nTitle: ${ticket.title}\nStatus: ${ticket.status}`;
  const html = `
    <h2>Ticket Updated</h2>
    <p><strong>Title:</strong> ${ticket.title}</p>
    <p><strong>Status:</strong> ${ticket.status}</p>
  `;

  return sendEmail({
    to: recipient.email,
    subject,
    text,
    html
  });
}; 