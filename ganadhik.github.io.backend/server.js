// My backend for handling contact form submissions

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();

// CORS setup - only allow requests from my GitHub Pages site
const corsOptions = {
  origin: 'https://adhikariganesh9813.github.io', // Only allow my portfolio frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

// Nodemailer setup - credentials are set in Render's environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // My Gmail address (from Render ENV)
    pass: process.env.EMAIL_PASS  // App password (from Render ENV)
  }
});

// --- API Endpoints ---

// Root route: just a quick check to see if backend is running
app.get('/', (req, res) => {
  res.send('Node.js Backend for contact form is running!');
});

// Main endpoint for sending emails from my contact form
app.post('/api/send-message', async (req, res) => {
  const { name, email, message } = req.body;

  // Quick validation to make sure all fields are filled
  if (!name || !email || !message) {
    return res.status(400).json({ status: 'error', message: 'Name, email, and message are all required.' });
  }

  // Compose the email
  const mailOptions = {
    from: process.env.EMAIL_USER, // Send from my Gmail
    to: process.env.EMAIL_USER,   // Send to myself
    replyTo: email,               // So I can reply directly to the sender
    subject: `New Message from Portfolio: ${name}`,
    text: `You have received a new message from your portfolio website:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    html: `
      <p>You have received a new message from your portfolio website:</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent from ${email} by ${name}`);
    res.status(200).json({ status: 'success', message: 'Your message has been sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send your message. Please try again later.' });
  }
});

// Start the server (Render provides the port in ENV)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Node.js Backend listening on port ${PORT}`);
  console.log(`Access locally at: http://localhost:${PORT}`);
});