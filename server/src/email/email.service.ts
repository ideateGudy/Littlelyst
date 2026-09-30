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
    const text = `Hello ${name},\n\nWelcome to Littlelyst! Thank you for registering.\n\nWe're excited to have you on board.\n\nBest regards,\nThe Littlelyst Team`;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Welcome to Littlelyst</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;color:#333;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:#1f2937;padding:30px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:28px;">Welcome to Littlelyst! 🎉</h1></div>
  <div style="padding:35px;">
    <p style="font-size:16px;line-height:1.6;">Hello ${name},</p>
    <p style="font-size:16px;line-height:1.6;">Thank you for registering with <strong>Littlelyst</strong>! We're excited to have you on board.</p>
    <p style="font-size:16px;line-height:1.6;margin-top:30px;">Best regards,<br><strong>The Littlelyst Team</strong></p>
  </div>
  <div style="background:#f9fafb;padding:20px;text-align:center;"><p style="margin:0;font-size:13px;color:#6b7280;">© ${new Date().getFullYear()} Littlelyst. All rights reserved.</p></div>
</div></body></html>`;

    await this.sendEmail(userEmail, subject, text, html);
  }

  async sendOtpEmail(userEmail: string, code: string): Promise<void> {
    const subject = `${code} is your Littlelyst verification code`;
    const text = `Your Littlelyst verification code is: ${code}. This code expires in 10 minutes.`;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Verification Code</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;color:#333;">
<div style="max-width:500px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
  <div style="background:#4f46e5;padding:25px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Littlelyst Verification</h1></div>
  <div style="padding:30px;text-align:center;">
    <p style="font-size:16px;color:#4b5563;margin-bottom:24px;">Use the code below to verify your account:</p>
    <div style="background:#f3f4f6;border:2px dashed #4f46e5;border-radius:8px;padding:16px;display:inline-block;margin-bottom:24px;">
      <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#1f2937;">${code}</span>
    </div>
    <p style="font-size:13px;color:#6b7280;">This code expires in 10 minutes. If you didn't request this, please ignore.</p>
  </div>
  <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Littlelyst. All rights reserved.</p>
  </div>
</div></body></html>`;

    await this.sendEmail(userEmail, subject, text, html);
  }

  async sendTransactionEmail(
    userEmail: string,
    name: string,
    amount: string | number | bigint,
    toAccount: string,
  ): Promise<void> {
    const subject = "Transaction successful!";
    const text = `Hello ${name},\n\nYour transaction of ${amount.toString()} to account ${toAccount} was successful.\n\nBest regards,\nThe Littlelyst Team`;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Transaction Successful</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;color:#333;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:#1f2937;padding:30px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:28px;">Transaction Successful! 🎉</h1></div>
  <div style="padding:35px;">
    <p>Hello ${name},</p>
    <p>Your transaction of <strong>${amount.toString()}</strong> to <strong>${toAccount}</strong> was successful.</p>
    <p style="margin-top:30px;">Best regards,<br><strong>The Littlelyst Team</strong></p>
  </div>
  <div style="background:#f9fafb;padding:20px;text-align:center;"><p style="margin:0;font-size:13px;color:#6b7280;">© ${new Date().getFullYear()} Littlelyst.</p></div>
</div></body></html>`;

    await this.sendEmail(userEmail, subject, text, html);
  }

  async sendTransactionFailureEmail(
    userEmail: string,
    name: string,
    amount: string | number | bigint,
    toAccount: string,
  ): Promise<void> {
    const subject = "Transaction failed!";
    const text = `Hello ${name},\n\nYour transaction of ${amount.toString()} to account ${toAccount} failed.\n\nBest regards,\nThe Littlelyst Team`;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Transaction Failed</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;color:#333;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:#1f2937;padding:30px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:28px;">Transaction Failed! ❌</h1></div>
  <div style="padding:35px;">
    <p>Hello ${name},</p>
    <p>Your transaction of <strong>${amount.toString()}</strong> to <strong>${toAccount}</strong> failed.</p>
    <p style="margin-top:30px;">Best regards,<br><strong>The Littlelyst Team</strong></p>
  </div>
  <div style="background:#f9fafb;padding:20px;text-align:center;"><p style="margin:0;font-size:13px;color:#6b7280;">© ${new Date().getFullYear()} Littlelyst.</p></div>
</div></body></html>`;

    await this.sendEmail(userEmail, subject, text, html);
  }

  async sendOrderReminderEmail(
    to: string,
    buyerName: string,
    productTitle: string,
    storeLink: string,
    customTemplate?: string | null,
  ): Promise<void> {
    const subject = `Complete your order for "${productTitle}" on Littlelyst`;
    
    let bodyText = `Hi ${buyerName},\n\nYou started checkout for "${productTitle}" but payment wasn't completed.\n\nVisit the store: ${storeLink}\n\nThe Littlelyst Team`;
    let customHtmlMessage = `<p style="font-size:16px;line-height:1.6;">Hi <strong>${buyerName}</strong>,</p>
      <p style="font-size:16px;line-height:1.6;">You started checking out <strong>"${productTitle}"</strong> but your payment wasn't completed.</p>`;

    if (customTemplate && customTemplate.trim()) {
      const replaced = customTemplate
        .replace(/{name}|{buyerName}|{buyer_name}/gi, buyerName)
        .replace(/{product}|{productTitle}|{product_title}/gi, productTitle)
        .replace(/{link}|{storeLink}|{store_link}|{paymentLink}/gi, storeLink);
      bodyText = replaced;
      customHtmlMessage = `<p style="font-size:15px;line-height:1.6;white-space:pre-wrap;">${replaced}</p>`;
    }

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Complete your order</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;color:#333;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:#10b981;padding:28px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:24px;">Don't forget your order! 🛒</h1></div>
  <div style="padding:32px;">
    ${customHtmlMessage}
    <div style="text-align:center;margin:28px 0;">
      <a href="${storeLink}" style="background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Complete Payment</a>
    </div>
    <p style="font-size:13px;color:#6b7280;">If you have questions, just reply to this email.</p>
    <p style="font-size:15px;margin-top:24px;">Best regards,<br><strong>The Littlelyst Team</strong></p>
  </div>
  <div style="background:#f9fafb;padding:16px;text-align:center;"><p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Littlelyst. All rights reserved.</p></div>
</div></body></html>`;

    await this.sendEmail(to, subject, bodyText, html);
  }
}
