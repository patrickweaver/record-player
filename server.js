require('dotenv').config();
var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());
const hbs = require("hbs");
app.set("view engine", "hbs");
app.set("views", "views");
hbs.registerPartials(__dirname + '/views/partials/');


var multer  = require('multer');
var upload = multer({ dest: __dirname + '/public/images/' });
var rp = require('request-promise-native');
const querystring = require('querystring');
const url = require('url');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

const projectUrl = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';
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
    authUrl: "https://accounts.spotify.com/authorize?" + querystring.stringify(query),
    loggedOut: true
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
    .catch(err => {
      console.log(err);
      handleError(res, err);
    });
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
  res.render('camera', {});
});

// This route works for both the async request from the frontend
// or as a form submittion if the fancy uploader doesn't work (no js).
// At the end the image is deleted from the server
app.get('/player', async function(req, res) {
  var apiResponse;
  var imagePath = false;
  imagePath = '/images/image.jpg';

  try {
    apiResponse = await apiChain(imagePath, req, res);
  } catch(e) {
    apiResponse = {
      error: true,
      errorMessage: "API requests failed."
    }
  }

  if (!apiResponse.error) {
    if (false) {
      res.json({
        error: false,
        googleVisionGuess: apiResponse.gvBestGuess,
        albumId: apiResponse.albumId
      });
    } else {
      /*
      res.render('player', {
        googleVisionGuess: apiResponse.gvBestGuess,
        embed: spotify.embed[0] + apiResponse.albumId + spotify.embed[1]
      });
      */
      //res.redirect('http://open.spotify.com/album/' + apiResponse.albumId);
      try {
        let devices = await rp(spotify.apiOptions(req.cookies.spotifyAccessToken));
        console.log("Devices:");
        console.log(devices);
        if (devices) {
          deviceId = devices.devices[0].id;
        }
        try {
          let playback = await rp(spotify.apiPlaybackOptions(req.cookies.spotifyAccessToken, apiResponse.albumId, deviceId));

          res.render('rpi', {});

        } catch(err) {
          console.log("Spotify Playback Request Error:");
          console.log(err);
          res.send("Playback Request Error");
        }

      } catch(err) {
        console.log("Spotify Devices Request Error:");
        console.log(err);
        res.send("Devices Request Error");
      }


      //res.send(devices);


    }
  } else {
    if (false) {
      res.json({
        error: true,
        errorMessage: apiResponse.errorMessage
      });
    } else {
      handleError(res, "Error: " + apiResponse.errorMessage);
    }
  }
});

// Once the async apiChain request returns, frontend redirects to player
// with Spotify album ID as query string parameter
/*
app.get('/player', function(req,res) {
  if (req.query.albumId && req.query.googleVisionGuess) {
    res.render('player', {
      googleVisionGuess: req.query.googleVisionGuess,
      embed: spotify.embed[0] + req.query.albumId + spotify.embed[1]
    })
  } else {
    res.redirect('/');
  }
});
*/

// General error handling
function handleError(res, err) {
  console.log("\nError");
  console.log(JSON.stringify(err));
  res.redirect('/error');
}

app.get('/error', function(req, res) {
  res.render('error', {});
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
