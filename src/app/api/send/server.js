const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS.split(',');

app.use(cors({
  origin: allowedOrigins,
  methods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(bodyParser.json());

// Telegram Bot Setup (Using Webhook)
const chatId = process.env.CHAT_ID;
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);

const webhookUrl = `https://shabanbuja.info/bot${token}`;
bot.setWebHook(webhookUrl);

app.post(`/bot${token}`, (req, res) => {
  //console.log(req.body); 
  bot.processUpdate(req.body);
  res.sendStatus(200);
});


app.post('/send', async (req, res) => {
  try {
    // Merrni IP-në e klientit
    const clientIp = req.headers['x-forwarded-for'] 
      ? req.headers['x-forwarded-for'].split(',')[0] 
      : req.connection.remoteAddress;

    const { email, subject, message } = req.body;

    const geoJsUrl = process.env.GEOJS_API_URL;
    const ipApiUrl = process.env.IPAPI_API_URL;

    const ipInfo = await axios.get(`${geoJsUrl}${clientIp}.json`).catch(async () => {
      return await axios.get(`${ipApiUrl}${clientIp}/json/`);
    });

    const { ip, timezone, organization_name, country, country_code, country_code3, asn } = ipInfo.data;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${email}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: subject,
      text: `
        - **IP Address**: ${ip}
        - **Country**: ${country} (${country_code} / ${country_code3}) 
        - **Organization**: ${organization_name} (ASN: ${asn})
        - **Timezone**: ${timezone}
        - **Message**: ${message}
      `,
    };

    const emailInfo = await transporter.sendMail(mailOptions);
    console.log('Email sent:', emailInfo.response);

    const telegramMessage = `
      📧 **New Email Received**:
      \nFrom: ${email}
      \nSubject: ${subject}
      \nMessage: ${message}
      \n\nIP Information:
      - **IP Address**: ${ip}
      - **Country**: ${country} (${country_code} / ${country_code3})
      - **Organization**: ${organization_name} (ASN: ${asn})
    `;

    await bot.sendMessage(chatId, telegramMessage);
    console.log('Message sent to Telegram.');

    res.status(200).json({ message: 'Email sent and notification sent to Telegram successfully' });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to send email or Telegram message' });
  }
});

app.get('/notify', async (req, res) => {
  try {
    // Get the client IP
    const clientIp = req.headers['x-forwarded-for'] 
      ? req.headers['x-forwarded-for'].split(',')[0] 
      : req.connection.remoteAddress;

    // Handle localhost IP
    if (clientIp === '::1' || clientIp === '127.0.0.1') {
      const localhostMessage = `
🌍 **New User Notification**:
- **IP Address**: ${clientIp}
- **Country**: Localhost (N/A)
- **Timezone**: Localhost
- **Organization**: Local Development
- **Continent**: N/A
- **Area Code**: 0
- **Latitude**: 0
- **Longitude**: 0
- **Accuracy**: N/A
`;
      await bot.sendMessage(chatId, localhostMessage);
      return res.status(200).send('Notification sent (localhost data used).');
    }

    const geoJsUrl = process.env.GEOJS_API_URL;
      const ipApiUrl = process.env.IPAPI_API_URL;


    const ipInfo = await axios.get(`${geoJsUrl}${clientIp}.json`).catch(async () => {
     return await axios.get(`${ipApiUrl}${clientIp}/json/`);
    });

    const { ip, timezone, organization, country, asn, organization_name, country_code, country_code3, continent_code, area_code, latitude, longitude, accuracy } = ipInfo.data;

    const message = `
🌍 **New User Notification**:
- **IP Address**: ${ip}
- **Country**: ${country} (${country_code} / ${country_code3})
- **Timezone**: ${timezone}
- **Organization**: ${organization_name} (ASN: ${asn})
- **Continent**: ${continent_code}
- **Area Code**: ${area_code}
- **Latitude**: ${latitude}
- **Longitude**: ${longitude}
- **Accuracy**: ${accuracy} meters
`;

    await bot.sendMessage(chatId, message);
    res.status(200).send('Notification sent to Telegram!');
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    res.status(500).send('Failed to send notification.');
  }
});


app.post('/notify-cv-download', async (req, res) => {
  const { message } = req.body;

  try {
    await bot.sendMessage(chatId, `📥 **Download Notification**: ${message}`);
    
    res.status(200).send('CV download notification sent.');
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    res.status(500).send('Failed to send notification.');
  }
});



// Start Server
app.listen(8080, () => {
  console.log('Server is running on port 8080');
});