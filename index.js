require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();

const DOCUSIGN_AUTH_URI = 'https://account-d.docusign.com/oauth';
const SCOPES = 'signature';

// Middleware
app.use(express.json());

// Set view engine
app.set('view engine', 'ejs');

// Routes
app.get('/auth-code', async (_, res) => {
  const authCodeURI = `${DOCUSIGN_AUTH_URI}/auth?response_type=code&scope=${SCOPES}&client_id=${process.env.INTEGRATION_KEY}&redirect_uri=${process.env.REDIRECT_URI}&login_hint=YOUR_LOGIN_HINT`;

  res.redirect(authCodeURI);
});

app.get('/callback', async (req, res) => {
  const authCode = req.query.code;
  console.log(`AUTH CODE: ${authCode}`);

  const authHeaderData = `${process.env.INTEGRATION_KEY}:${process.env.SECRET_KEY}`;
  const encodedAuthHeaderData = Buffer.from(authHeaderData).toString('base64');

  console.log(`ENCODED: ${encodedAuthHeaderData}`);

  const response = await fetch(`${DOCUSIGN_AUTH_URI}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encodedAuthHeaderData}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=authorization_code&code=${authCode}`,
  });

  const body = await response.json();

  const userinfo = await getUserInfo(body.access_token);

  res.json(userinfo);
});

async function getUserInfo(accessToken) {
  const response = await fetch(`${DOCUSIGN_AUTH_URI}/userinfo`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.json();
}

app.set('port', process.env.PORT || 3000);

const server = app.listen(app.get('port'), () => {
  console.log(`Listening on port ${server.address().port}`);
});
