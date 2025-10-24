import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { emailConfig } from '../../../config/emailConfigManager'

export async function POST(request) {
  try {
    const { to, subject, meeting, icsContent } = await request.json()

    // Validate configuration using the configuration manager
    const validation = emailConfig.validateConfig()
    if (!validation.isValid) {
      const configSummary = emailConfig.getConfigSummary()
      return NextResponse.json({
        success: false,
        message: 'Email configuration error',
        errors: validation.errors,
        warnings: validation.warnings,
        provider: validation.provider,
        instructions: configSummary.instructions,
        configSummary
      }, { status: 500 })
    }

    // Get transporter configuration
    const transporterConfig = emailConfig.getTransporterConfig()
    const transporter = nodemailer.createTransporter(transporterConfig)

    // Get sender information
    const senderInfo = emailConfig.getSenderInfo()

    const emailBody = `
Dear ${meeting.customerName || 'Customer'},

You have been invited to a meeting with GK Finance.

Meeting Details:
• Subject: ${meeting.subject}
• Date: ${new Date(meeting.startDateTime).toLocaleDateString('en-GB', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
• Time: ${new Date(meeting.startDateTime).toLocaleTimeString('en-GB', {
  hour: '2-digit',
  minute: '2-digit'
})} - ${new Date(meeting.endDateTime).toLocaleTimeString('en-GB', {
  hour: '2-digit',
  minute: '2-digit'
})}
• Duration: ${meeting.duration} minutes
• Location: ${meeting.location}

${meeting.agenda ? `Agenda:\n${meeting.agenda}\n\n` : ''}

${meeting.notes ? `Additional Notes:\n${meeting.notes}\n\n` : ''}

Please find the calendar invitation attached to this email. You can import this into your calendar application to receive reminders and updates.

If you need to reschedule or have any questions, please contact us immediately.

Best regards,
GK Finance Team

---
This is an automated message from the GK Finance Customer Management System.
    `.trim()

    const mailOptions = {
      from: senderInfo.from,
      to: to,
      subject: subject,
      text: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #0056b3; margin-bottom: 20px;">
              <span style="color: #28a745;">📅</span> Meeting Invitation - GK Finance
            </h2>
            
            <p>Dear <strong>${meeting.customerName || 'Customer'}</strong>,</p>
            
            <p>You have been invited to a meeting with GK Finance.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0056b3;">
              <h3 style="color: #0056b3; margin-top: 0;">Meeting Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #495057;">Subject:</td>
                  <td style="padding: 8px; color: #212529;">${meeting.subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #495057;">Date:</td>
                  <td style="padding: 8px; color: #212529;">${new Date(meeting.startDateTime).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #495057;">Time:</td>
                  <td style="padding: 8px; color: #212529;">${new Date(meeting.startDateTime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - ${new Date(meeting.endDateTime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #495057;">Duration:</td>
                  <td style="padding: 8px; color: #212529;">${meeting.duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #495057;">Location:</td>
                  <td style="padding: 8px; color: #212529;">${meeting.location}</td>
                </tr>
              </table>
            </div>
            
            ${meeting.agenda ? `
              <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="color: #495057; margin-top: 0;">Agenda</h4>
                <p style="margin-bottom: 0; white-space: pre-line;">${meeting.agenda}</p>
              </div>
            ` : ''}
            
            ${meeting.notes ? `
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #ffeaa7;">
                <h4 style="color: #856404; margin-top: 0;">Additional Notes</h4>
                <p style="margin-bottom: 0; white-space: pre-line;">${meeting.notes}</p>
              </div>
            ` : ''}
            
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #bee5eb;">
              <p style="margin: 0; color: #0c5460;">
                <strong>📎 Calendar Invitation:</strong> Please find the calendar invitation attached to this email. 
                You can import this into your calendar application (Outlook, Google Calendar, Apple Calendar, etc.) 
                to receive reminders and updates.
              </p>
            </div>
            
            <p>If you need to reschedule or have any questions, please contact us immediately.</p>
            
            <p>Best regards,<br>
            <strong>GK Finance Team</strong></p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="font-size: 12px; color: #6c757d; text-align: center;">
              This is an automated message from the GK Finance Customer Management System.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'meeting-invitation.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST'
        }
      ]
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions)

    console.log('Calendar invite sent:', info.messageId)

    return NextResponse.json({
      success: true,
      message: 'Calendar invite sent successfully',
      messageId: info.messageId
    })

  } catch (error) {
    console.error('Error sending calendar invite:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to send calendar invite',
      error: error.message
    }, { status: 500 })
  }
}
