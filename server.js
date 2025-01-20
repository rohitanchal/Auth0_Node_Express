const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const logger = require('morgan');
const path = require('path');
const router = require('./routes/index');
const { auth } = require('express-openid-connect');

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('ISSUER_BASE_URL:', process.env.ISSUER_BASE_URL);

if (!process.env.ISSUER_BASE_URL) {
  throw new Error('ISSUER_BASE_URL is not defined in the .env file or is invalid.');
}

const app = express();

// Set the port
const port = process.env.PORT || 3000;

// Express settings
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Configure OpenID Connect authentication
const config = {
  authRequired: false,
  auth0Logout: true,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  baseURL: process.env.BASE_URL || `http://localhost:${port}`,
  clientID: process.env.CLIENT_ID,
  secret: process.env.SECRET,
};

if (!config.issuerBaseURL || !config.clientID || !config.secret) {
  throw new Error('Missing required environment variables. Check your .env file.');
}

app.use(auth(config));

// Middleware to make the `user` object available in all views
app.use((req, res, next) => {
  res.locals.user = req.oidc.user;
  next();
});

// Define routes
app.use('/', router);

// Handle 404 errors
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: process.env.NODE_ENV !== 'production' ? err : {},
  });
});

// Start the server
http.createServer(app).listen(port, () => {
  console.log(`Server is running at ${config.baseURL}`);
});
