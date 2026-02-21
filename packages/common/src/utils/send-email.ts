import transporter from "../transporter/nodemailer";
import generateEmailHTML from "./generate-email-template";

export type SendEmailData = {
  to: string;
  template: string;
  subject: string;
  payload: { [key: string]: any };
};

export const sendEmail = async (data: SendEmailData) => {
  const html = await generateEmailHTML(data.template, data.payload);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME;

  const mailOptions = {
    from: `${adminName} <${adminEmail}>`,
    to: data.to,
    subject: data.subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
