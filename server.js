var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());
const hbs = require("hbs");
app.set("view engine", "hbs");
app.set("views", "views");


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
if (0) {
  app.use((req,res) => {
    res.clearCookie('spotifyAccessToken');
    res.clearCookie('spotifyRefreshToken');
    res.send("<h1>Clear</h1>");
  });
}


app.use(express.static('public'));

app.get('/auth', (req, res) => {
  let stateRandString = uuidv4();
  res.cookie('spotifyStateString', stateRandString);
  let query = spotify.authQueryString(stateRandString);
  res.render('auth', {
    authUrl: "https://accounts.spotify.com/authorize?" + querystring.stringify(query)
  });
});

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


app.get('/', (req, res) => {
  res.render('camera', {});
});

app.post('/player', upload.single('file'), async function(req, res) {
  let imagePath = '/images/' + req.file.filename;
  let apiResponse = await apiChain(imagePath, req, res);
  if (!apiResponse.error) {
    if (req.body.async) {
      res.json({
        error: false,
        googleVisionGuess: apiResponse.gvBestGuess,
        albumId: apiResponse.albumId
      });
    } else {
      res.render('player', {
        googleVisionGuess: apiResponse.gvBestGuess,
        embed: spotify.embed[0] + apiResponse.albumId + spotify.embed[1] 
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
  try {
    fs.unlinkSync('/app/public' + imagePath);
  } catch (err) {
    console.log('error deleting ' + imagePath + ': ' + err);
  }
});


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
