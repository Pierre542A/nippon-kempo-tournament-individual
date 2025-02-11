// middlewares/sendEmail.js
const Mailjet = require("node-mailjet");

const mailjet = new Mailjet({
  apiKey: process.env.MJ_APIKEY_PUBLIC,
  apiSecret: process.env.MJ_APIKEY_PRIVATE,
});

const sendEmail = async (recipientEmail, subject, htmlContent) => {
  try {
    await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: "dlf.sur.insta@gmail.com",
            Name: "Sensation CBD",
          },
          To: [{ Email: recipientEmail }],
          Subject: subject,
          HTMLPart: htmlContent,
        },
      ],
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email.");
  }
};

module.exports = sendEmail;
