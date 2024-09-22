// app.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const session = require('express-session');

const app = express();

app.set('view engine', 'ejs');
app.set('trust proxy', 1);

// Environment variables for branding
const BRAND_COLOR = process.env.BRAND_COLOR || '#ffffff';
const TEXT_COLOR = process.env.TEXT_COLOR || '#007bff'; 
const LOGO_URL = process.env.LOGO_URL || '/logo.png';
const BUTTON_BG_COLOR = process.env.BUTTON_BG_COLOR || '#333333';
const BUTTON_TEXT_COLOR = process.env.BUTTON_TEXT_COLOR || '#ffffff';
const BUTTON_HOVER_BG_COLOR = process.env.BUTTON_HOVER_BG_COLOR || '#555555';
const BUTTON_HOVER_TEXT_COLOR = process.env.BUTTON_HOVER_TEXT_COLOR || '#ffffff';

// HaloPSA configuration
const HALOPSA_BASE_URL = process.env.HALOPSA_BASE_URL; 
const HALOPSA_API_URL = `${HALOPSA_BASE_URL}/api`;
const HALOPSA_EMBED_CSS_URL = `${HALOPSA_BASE_URL}/embed/newticket.css`;
const HALOPSA_EMBED_JS_URL = `${HALOPSA_BASE_URL}/embed/newticket.js`;


// HaloPSA OAuth configuration
const HALOPSA_CLIENT_ID = process.env.HALOPSA_CLIENT_ID;
const HALOPSA_CLIENT_SECRET = process.env.HALOPSA_CLIENT_SECRET;
const HALOPSA_TENANT = process.env.HALOPSA_TENANT || '';
const HALOPSA_REDIRECT_URI = process.env.HALOPSA_REDIRECT_URI;
const HALOPSA_AUTHORIZATION_ENDPOINT = `${HALOPSA_BASE_URL}/auth/authorize`;
const HALOPSA_TOKEN_ENDPOINT = `${HALOPSA_BASE_URL}/auth/token`;
const HALOPSA_SCOPES = process.env.HALOPSA_SCOPES || 'all';

app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
  secret: 'your_session_secret', // Replace with a secure secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } // Set to true if using HTTPS
}));

// Intercept page route (now at /login)
app.get('/login', (req, res) => {
  // Retrieve any query parameters
  const { username, event } = req.query;
  const Org = req.session.org
  
  // Store them in the session for later use
  if (username && event) {
    req.session.username = username;
    req.session.event = event;
  }

  res.render('index', {
    brandColor: BRAND_COLOR,
    textColor: TEXT_COLOR,
    logoUrl: LOGO_URL,
    buttonBgColor: BUTTON_BG_COLOR,
    buttonTextColor: BUTTON_TEXT_COLOR,
    buttonHoverBgColor: BUTTON_HOVER_BG_COLOR,
    buttonHoverTextColor: BUTTON_HOVER_TEXT_COLOR,
    Org
  });
});

// Route to initiate OAuth flow
app.get('/auth', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauth_state = state;

  // Ensure originalUrl is set
  if (!req.session.originalUrl) {
    req.session.originalUrl = '/'; // Default to home page if no original URL
  }

  const authorizationUrl = `${HALOPSA_AUTHORIZATION_ENDPOINT}?` + querystring.stringify({
    response_type: 'code',
    tenant: HALOPSA_TENANT,
    client_id: HALOPSA_CLIENT_ID,
    redirect_uri: HALOPSA_REDIRECT_URI,
    scope: HALOPSA_SCOPES,

    state: state,
  });

  res.redirect(authorizationUrl);
});

// Route to handle OAuth callback
app.get('/oauth/callback', async (req, res) => {
    // Log that the callback route has been hit
    console.log('Received request at /oauth/callback');

    // Log the query parameters received from HaloPSA
    console.log('Query parameters:', req.query);
  
  const { code, state } = req.query;
  const storedState = req.session.oauth_state;

  // Clear the oauth_state cookie
  delete req.session.oauth_state

  // Log the state values for comparison
  console.log('Received state:', state);
  console.log('Stored state:', storedState);

  if (!state || state !== storedState) {
    return res.status(403).send('State mismatch error');
  }

  try {

    // Log that you're about to exchange the code for an access token
    console.log('Exchanging authorization code for access token');

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(HALOPSA_TOKEN_ENDPOINT, querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: HALOPSA_REDIRECT_URI,
      client_id: HALOPSA_CLIENT_ID,
      client_secret: HALOPSA_CLIENT_SECRET,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Log the response from the token exchange - uncomment for debugging
    // console.log('Token response data:', tokenResponse.data);

    const { access_token, expires_in } = tokenResponse.data;

    // Store access token in session
    req.session.accessToken = access_token;

      // **Make authenticated GET request to HaloPSA API to get user details**
      try {
        const userResponse = await axios.get(`${HALOPSA_BASE_URL}/api/ClientCache`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
  
        // Extract user details from response
        const userData = userResponse.data;
  
        // Store user details in session
        req.session.user = userData.user; // Collect User data of the signed in user
        req.session.org = userData.organisation // Use the Halo branding details for branding
        
        // Log returned User Data from Halo API. Uncomment for debugging.
        console.log('User data:', userData.organisation);
      } catch (apiError) {
        console.error(
          'Error fetching user details:',
          apiError.response ? apiError.response.data : apiError.message
        );
        return res.status(500).render('error',{
          message: "Failed to fetch user details. Please validate HaloPSA API Details",
          brandColor: BRAND_COLOR,
          textColor: TEXT_COLOR,
          logoUrl: LOGO_URL,
          Org: {}
          });
      }

   // Render a page that notifies the main window
   const redirectUrl = req.session.originalUrl || '/';
   delete req.session.originalUrl; // Clean up the session
   console.log('Redirecting to:', redirectUrl);
   res.render('oauth_callback', {originalUrl: redirectUrl});
  } catch (error) {
    console.error('Error exchanging code for token:', error.message);
    res.status(401).render('error',{
      message: "Authentication failed. PKCE Mismatch",
      brandColor: BRAND_COLOR,
      textColor: TEXT_COLOR,
      logoUrl: LOGO_URL,
    });
  }

});


// Middleware to check authentication
async function isAuthenticated(req, res, next) {
  console.log('isAuthenticated middleware called on:', req.path);
  const accessToken = req.session.accessToken;
  if (accessToken) {
    next();
  } else {
      // **Make unauthenticated GET request to HaloPSA API to get user details**
      try {
        const userResponse = await axios.get(`${HALOPSA_BASE_URL}/api/ClientCache`);
  
        // Extract user details from response
        const userData = userResponse.data;
  
        // Store user details in session
        req.session.org = userData.organisation; // Use branding from HaloPSA if available
        
        // Log returned User Data from Halo API. Uncomment for debugging.
        console.log('User data:', userData.organisation);
      } catch (apiError) {
        console.error(
          'Error fetching user details:',
          apiError.response ? apiError.response.data : apiError.message
        );
        return res.status(500).render('error',{
          message: "Failed to fetch org details. Please validate HaloPSA CORS is setup properly Details",
          brandColor: BRAND_COLOR,
          textColor: TEXT_COLOR,
          logoUrl: LOGO_URL
          });
      }
    // Store the original URL in the session
    req.session.originalUrl = req.originalUrl;
    res.redirect('/login');
  }
}

app.get('/new-customer', (req, res) => {
    const Org = req.session.org;
  
    res.render('new_customer', {
      brandColor: BRAND_COLOR,
      textColor: TEXT_COLOR,
      logoUrl: LOGO_URL,
      buttonBgColor: BUTTON_BG_COLOR,
      buttonTextColor: BUTTON_TEXT_COLOR,
      buttonHoverBgColor: BUTTON_HOVER_BG_COLOR,
      buttonHoverTextColor: BUTTON_HOVER_TEXT_COLOR,
      haloApiUrl: HALOPSA_API_URL,
      haloEmbedCssUrl: HALOPSA_EMBED_CSS_URL,
      haloEmbedJsUrl: HALOPSA_EMBED_JS_URL,
      Org,
      ticketTypeId: process.env.HALOPSA_TICKET_TYPE_ID,
      ticketTypeKey: process.env.HALOPSA_TICKET_TYPE_KEY
    });
  });

// handles logout process
app.get('/logout', (req, res) => {
  // Clear the access token session
  delete req.session.accessToken;
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    // Redirect to the login page
    res.redirect('/login');
  });
});


// Route to capture username and event from URL
app.get('/:username/:event', isAuthenticated, async (req, res) => {
  const { username, event } = req.params;

  // Store them in the session
  req.session.username = username;
  req.session.event = event;

  try {
    // Construct the Calendly URL
    const calendlyUrl = `https://calendly.com/${username}/${event}`;

    // Make a HEAD request to Calendly to check if the URL is valid
    const response = await axios.head(calendlyUrl);

    // Check if the response status is 200
    if (response.status === 200) {
      // Valid Calendly link
      req.session.username = username;
      req.session.event = event;
      const user = req.session.user;
      const Org = req.session.org;

      // Redirect to the booking page
      res.render('booking', {
        username,
        event,
        brandColor: BRAND_COLOR,
        textColor: TEXT_COLOR,
        logoUrl: LOGO_URL,
        buttonBgColor: BUTTON_BG_COLOR,
        buttonTextColor: BUTTON_TEXT_COLOR,
        buttonHoverBgColor: BUTTON_HOVER_BG_COLOR,
        buttonHoverTextColor: BUTTON_HOVER_TEXT_COLOR,
        user,
        Org
      });
    }
    else {
      // Calendly link does not exist
      res.status(404).render('error',{
        message: 'Invalid booking link. Please check the URL.',
        brandColor: BRAND_COLOR,
        textColor: TEXT_COLOR,
        logoUrl: LOGO_URL
      })
    }
  } catch (error) {
    console.log(error);
    // Calendly link does not exist or an error occurred
    res.status(500).render('error',{
      message: error,
      brandColor: BRAND_COLOR,
      textColor: TEXT_COLOR,
      logoUrl: LOGO_URL
    })
  }
});

// Home page (booking page) route
app.get('/', (req, res) => {
  const Org = req.session.org;
  
  res.render('home', {
    brandColor: BRAND_COLOR,
    textColor: TEXT_COLOR,
    logoUrl: LOGO_URL,
    buttonBgColor: BUTTON_BG_COLOR,
    buttonTextColor: BUTTON_TEXT_COLOR,
    buttonHoverBgColor: BUTTON_HOVER_BG_COLOR,
    buttonHoverTextColor: BUTTON_HOVER_TEXT_COLOR,
    Org
  });
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
