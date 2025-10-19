// utils/emailHelper.js
const nodemailer = require("nodemailer");

// Simple function to send mail to multiple recipients
async function sendMailToMany(recipients, subject, text) {
  // Configure your email transporter
  let transporter = nodemailer.createTransport({
    service: "gmail", // or your SMTP
    auth: {
        user: "bitplacementportal@gmail.com", // 🔹 Replace with your email
        pass: "yckz uxvi olib szbf", // 🔹 Use an app password, NOT your email password!
    },
  });

  // Prepare mail options
  let mailOptions = {
    from: "bitplacementportal@gmail.com",
    to: recipients, // array or comma-separated
    subject,
    text,
  };

  // Send
  await transporter.sendMail(mailOptions);
}

module.exports = { sendMailToMany };
