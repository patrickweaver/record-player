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
  let query = spotify.authQueryStringObject;
  res.render('auth', {
    authUrl: "https://accounts.spotify.com/authorize?" + querystring.stringify(query)
  });
});

app.get('/auth-callback', (req, res) => {
  if (req.query.state === spotify.stateString && !req.query.error) {
    var code = req.query.code;
    
    const spotifyAuthOptions = spotify.authOptions(code);
    
    rp(spotifyAuthOptions)
    .then(data => {
      spotify.setCookies(res, data);
      res.redirect('/');
    })
    .catch(err => handleError(res, err));
  } else {
   res.send("Error: " + req.query.error);     
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
  // {error: bool, url: url, errorMessage: errorMessage}
  if (!apiResponse.error) {
    res.render('player', {
      embed: spotify.embed[0] + apiResponse.albumId + spotify.embed[1] 
    });
  } else {
    res.send("Error: " + apiResponse.errorMessage);
  }
  try {
    fs.unlinkSync('/app/public' + imagePath);
  } catch (err) {
    console.log('error deleting ' + imagePath + ': ' + err);
  }
});

app.get('/player', function(req,res) {
  res.redirect('/camera');
});

function handleError(res, err) {
  console.log("/nError");
  console.log(JSON.stringify(err));
  res.redirect(err);
}

app.get('/error', function(req, res) {
  res.render('error', {});
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
