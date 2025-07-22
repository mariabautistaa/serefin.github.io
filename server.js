const express = require('express');
const session = require('express-session');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for your frontend (GitHub Pages)
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true
}));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

const {
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
  BRIGHTSPACE_HOST
} = process.env;

const AUTHORIZE_URL = `${BRIGHTSPACE_HOST}/d2l/auth/oauth2/authorize`;
const TOKEN_URL = `${BRIGHTSPACE_HOST}/d2l/auth/token`;

// Login route → redirects to Brightspace login
app.get('/login', (req, res) => {
  const authUrl = `${AUTHORIZE_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
});

// OAuth callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  try {
    const tokenRes = await axios.post(TOKEN_URL, null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI
      }
    });

    req.session.access_token = tokenRes.data.access_token;
    res.redirect(`${process.env.FRONTEND_ORIGIN}/your-widget.html`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('OAuth failed');
  }
});

// API route to get courses
app.get('/api/courses', async (req, res) => {
  const token = req.session.access_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const apiRes = await axios.get(`${BRIGHTSPACE_HOST}/d2l/api/lp/1.45/enrollments/myenrollments/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const courses = apiRes.data.Items.map(c => ({
      name: c.CourseOffering.Name,
      code: c.CourseOffering.Code
    }));

    res.json(courses);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to load courses' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
