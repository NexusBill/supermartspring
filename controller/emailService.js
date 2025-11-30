const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "kaviyarasan.argm@gmail.com",
    pass: "tbmv gdcc eqty cqxl"
  },
});

async function sendEmail(to, subject, html) {
  return await transporter.sendMail({
    from: `kaviyarasan.argm@gmail.com`,
    to,
    subject,
    html,
    cc:`1549079@gmail.com`
  });
}

module.exports = sendEmail;
