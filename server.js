var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());
const hbs = require("hbs");
app.set("view engine", "hbs");
app.set("views", "views");
hbs.registerPartials(__dirname + '/views/partials/');


var multer  = require('multer');
var upload = multer({ dest: __dirname + '/public/uploaded-images/' });
var rp = require('request-promise');
const querystring = require('querystring');
const url = require('url');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

const projectUrl = process.env.PROJECT_URL;
const NOTE = process.env.NOTE
const apiChain = require('./apiChain');
const spotify = require('./spotify');


/* Routes */

app.use(express.static('public'));

// Explains the app and has Spotify login link
app.get('/auth', (req, res) => {
  let stateRandString = process.env.SPOTIFY_STATE_STRING;
  res.cookie('spotifyStateString', stateRandString);
  let query = spotify.authQueryString(stateRandString);
  res.render('auth', {
    projectUrl: projectUrl,
    note: NOTE,
    authUrl: "https://accounts.spotify.com/authorize?" + querystring.stringify(query),
    loggedOut: true,
    analyticsUrl: process.env.ANALYTICS_URL
  });
});

// Spotify redirects to this url, it sets cookies, then redirects
app.get('/auth-callback', (req, res) => {
  if (req.query.state === req.cookies.spotifyStateString && !req.query.error) {
    var code = req.query.code;
    
    const spotifyAuthOptions = spotify.authOptions(code);
    rp(spotifyAuthOptions)
    .then(data => {
      spotify.setCookies(res, data);
      res.redirect('/');
    })
    .catch(err => handleError(res, err));
  } else {
    handleError(res, "Wrong spotify auth code");     
  }
});

// Logs out of Spotify, then redirects
app.get('/logout', (req,res) => {
  res.clearCookie('spotifyAccessToken');
  res.clearCookie('spotifyRefreshToken');
  res.redirect('/');
});

// Checks for login cookie, if it doesn't find it redirects
app.use(function(req, res, next) {
  if (req.cookies.spotifyAccessToken) {
    next();
  } else {
    if (req.cookies.spotifyRefreshToken) {
      const spotifyRefreshOptions = spotify.refreshOptions(req.cookies.spotifyRefreshToken);
      rp(spotifyRefreshOptions)
      .then(data => {
        spotify.setCookies(res, data);
        next();
      })
      .catch(err => handleError(res, err));
    } else {
      res.redirect('/auth');
    }
  }
});


// Camera is default view, unless not logged in
app.get('/', (req, res) => {
  res.render('camera', {
    projectUrl: projectUrl,
    note: NOTE,
    analyticsUrl: process.env.ANALYTICS_URL
  });
});

// This route works for both the async request from the frontend
// or as a form submittion if the fancy uploader doesn't work (no js).
// At the end the image is deleted from the server
app.post('/player', upload.single('file'), async function(req, res) {
  var apiResponse;
  var imagePath = false;
  if (req.file && req.file.filename) {
    imagePath = '/uploaded-images/' + req.file.filename;
  } else {
    apiResponse = {
      error: true,
      errorMessage: "No image file."
    }
  }
  
  if (imagePath) {
    try {
      apiResponse = await apiChain(imagePath, req, res);
      if (apiResponse.error) {
        throw "No albums found."
      }
    } catch(e) {
      apiResponse = {
        error: true,
        errorMessage: "API requests failed or no albums found."
      }
    }
  }
  
  if (!apiResponse.error) {
    if (req.body.async) {
      res.json({
        error: false,
        googleVisionGuess: apiResponse.gvBestGuess,
        albumId: apiResponse.albumId
      });
    } else {
      res.render('player', {
        projectUrl: projectUrl,
        note: NOTE,
        googleVisionGuess: apiResponse.gvBestGuess,
        embed: spotify.embed[0] + apiResponse.albumId + spotify.embed[1],
        analyticsUrl: process.env.ANALYTICS_URL
      });
    }
  } else {
    if (req.body.async) {
      res.json({
        error: true,
        errorMessage: apiResponse.errorMessage
      });
    } else {
      handleError(res, "Error: " + apiResponse.errorMessage);
    }
  }
  if (imagePath) {
    try {
      fs.unlinkSync('./public' + imagePath);
    } catch (err) {
      console.log('error deleting ' + './app/public' + imagePath + ': ' + err);
    }
  }
});

// Once the async apiChain request returns, frontend redirects to player
// with Spotify album ID as query string parameter
app.get('/player', function(req,res) {
  if (req.query.albumId && req.query.googleVisionGuess) {
    res.render('player', {
      projectUrl: projectUrl,
      note: NOTE,
      googleVisionGuess: req.query.googleVisionGuess,
      embed: spotify.embed[0] + req.query.albumId + spotify.embed[1],
      analyticsUrl: process.env.ANALYTICS_URL
    })
  } else {
    res.redirect('/');
  }
});

// General error handling
function handleError(res, err) {
  console.log("\nError");
  console.log(JSON.stringify(err));
  res.redirect('/error');
}

app.get('/error', function(req, res) {
  res.render('error', {
    projectUrl: projectUrl,
    note: NOTE,
    analyticsUrl: process.env.ANALYTICS_URL
  });
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
