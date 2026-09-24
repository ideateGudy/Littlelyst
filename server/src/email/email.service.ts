import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { Transporter } from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor() {
    const user = process.env.EMAIL_USER;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const refreshToken = process.env.REFRESH_TOKEN;

    if (user && clientId && clientSecret && refreshToken) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user,
          clientId,
          clientSecret,
          refreshToken,
        },
      });

      this.transporter.verify((error) => {
        if (error) {
          this.logger.error("Error connecting to email server:", error);
        } else {
          this.logger.log("Email server is ready to send messages");
        }
      });
    } else {
      this.logger.warn(
        "Email credentials not fully configured; emails will be logged only.",
      );
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[MOCK EMAIL] To: ${to} | Subject: ${subject} | Text: ${text}`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Littlelyst" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`Message sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error("Error sending email:", error);
    }
  }

  async sendRegistrationEmail(userEmail: string, name: string): Promise<void> {
    const subject = "Welcome to Littlelyst! 🎉";
    const text = `Hello ${name},

Welcome to Littlelyst! Thank you for registering.

We’re excited to have you on board. Your account is now ready, and we look forward to helping you get the most out of Littlelyst.

If you have any questions or need assistance, our team is here to help.

Best regards,
The Littlelyst Team`;

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Littlelyst</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="background-color: #1f2937; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                        Welcome to Littlelyst! 🎉
                    </h1>
                </div>
                <div style="padding: 35px;">
                    <p style="font-size: 16px; line-height: 1.6;">Hello ${name},</p>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Thank you for registering with <strong>Littlelyst</strong>! We're excited to have you on board.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Your account is now ready, and you can start exploring everything Littlelyst has to offer.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
                        Best regards,<br>
                        <strong>The Littlelyst Team</strong>
                    </p>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                        © ${new Date().getFullYear()} Littlelyst. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    await this.sendEmail(userEmail, subject, text, html);
  }

  async sendOtpEmail(userEmail: string, code: string): Promise<void> {
    const subject = `${code} is your Littlelyst verification code`;
    const text = `Your Littlelyst verification code is: ${code}. This code expires in 10 minutes.`;

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 500px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                <div style="background-color: #4f46e5; padding: 25px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                        Littlelyst Verification
                    </h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">Use the verification code below to verify your account:</p>
                    <div style="background-color: #f3f4f6; border: 2px dashed #4f46e5; border-radius: 8px; padding: 16px; display: inline-block; margin-bottom: 24px;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1f2937;">${code}</span>
                    </div>
                    <p style="font-size: 13px; color: #6b7280;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
                </div>
                <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        © ${new Date().getFullYear()} Littlelyst. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    await this.sendEmail(userEmail, subject, text, html);
  }

  async sendTransactionEmail(
    userEmail: string,
    name: string,
    amount: string | number | bigint,
    toAccount: string,
  ): Promise<void> {
    const subject = "Transaction successful!";
    const text = `Hello ${name},

Your transaction of ${amount.toString()} to account ${toAccount} was successful.

Thank you for using Littlelyst!

Best regards,
The Littlelyst Team`;

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Transaction Successful</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="background-color: #1f2937; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                        Transaction Successful! 🎉
                    </h1>
                </div>
                <div style="padding: 35px;">
                    <p style="font-size: 16px; line-height: 1.6;">Hello ${name},</p>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Your transaction of <strong>${amount.toString()}</strong> to account <strong>${toAccount}</strong> was successful.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6;">Thank you for using Littlelyst!</p>
                    <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
                        Best regards,<br>
                        <strong>The Littlelyst Team</strong>
                    </p>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                        © ${new Date().getFullYear()} Littlelyst. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    await this.sendEmail(userEmail, subject, text, html);
  }

  async sendTransactionFailureEmail(
    userEmail: string,
    name: string,
    amount: string | number | bigint,
    toAccount: string,
  ): Promise<void> {
    const subject = "Transaction failed!";
    const text = `Hello ${name},

Your transaction of ${amount.toString()} to account ${toAccount} failed.

Thank you for using Littlelyst!

Best regards,
The Littlelyst Team`;

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Transaction Failed</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="background-color: #1f2937; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                        Transaction Failed! ❌
                    </h1>
                </div>
                <div style="padding: 35px;">
                    <p style="font-size: 16px; line-height: 1.6;">Hello ${name},</p>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Your transaction of <strong>${amount.toString()}</strong> to account <strong>${toAccount}</strong> failed.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6;">Thank you for using Littlelyst!</p>
                    <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
                        Best regards,<br>
                        <strong>The Littlelyst Team</strong>
                    </p>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                        © ${new Date().getFullYear()} Littlelyst. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    await this.sendEmail(userEmail, subject, text, html);
  }
}
