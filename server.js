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
  console.log('auth');
  let query = spotify.authQueryStringObject;
  //res.redirect("https://accounts.spotify.com/authorize?" + querystring.stringify(query));
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
      /*
      console.log("access_token: " + data.access_token);
      console.log("token_type: " + data.token_type);
      console.log("scope: " + data.scope);
      console.log("expires_in: " + data.expires_in);
      console.log("refresh_token: " + data.refresh_token);
      */
      //spotify.token = data.access_token
      
      let spotifyAccessOptions = {
        // Spotify sends token in seconds, express wants milliseconds
        // remove 5 seconds to avoid race conditions.
        //maxAge: (data.expires_in - 5) * 1000
        maxAge: 25000
      }
      res.cookie('spotifyAccessToken', data.access_token, spotifyAccessOptions);
      res.cookie('spotifyRefreshToken', data.refresh_token);
      res.redirect('/');
    })
    .catch(err => {
      res.send(err.message);
    });
  } else {
   res.send("Error: " + req.query.error);     
  }
});


function refreshSpotifyToken(refreshToken) {
  
  let options = {
    method: 'post',
    uri: 'https://accounts.spotify.com/api/token',
    form: {
      grant_type:	'refresh_token',
      refresh_token: refreshToken
    },
    json: true
  }
  
  let tokenApiResponse = rp(options)
  .then(function(data) {
    console.log("Refresh");
    console.log(data);
  })
  .catch(function(err) {
    console.log("Refresh Error");
    console.log(err);
  });
  return tokenApiResponse;
}


app.use(function(req, res, next) {
  if (req.cookies.spotifyAccessToken) {
    next();
  } else {
    if (req.cookies.spotifyRefreshToken) {
      let accessToken = refreshSpotifyToken(req.cookies.spotifyRefreshToken);
      console.log(JSON.stringify(accessToken));
      res.send("access");
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

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
