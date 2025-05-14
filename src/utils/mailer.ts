import nodemailer from 'nodemailer';
import dotnev from 'dotenv';
import e from 'express';

dotnev.config();

export const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth:{
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
});

transport.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP connection failed:', err);
  } else {
    console.log('✅ SMTP ready to send messages');
  }
});

export const sendEmail = async (to: string, subject: string, text: string) => {
   await transport.sendMail({
        from: `"ResumeGen" <no-reply@resumegen.com>`,
        to,
        subject,
        html: text,
    });
}