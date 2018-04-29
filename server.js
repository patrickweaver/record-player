var express = require('express');
var app = express();
var multer  = require('multer');
var upload = multer({ dest: __dirname + '/public/images/' })
var rp = require('request-promise-native');
const querystring = require('querystring');
const url = require('url');
const fs = require('fs');
const projectUrl = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';
const apiChain = require('./apiChain');
const spotify = require('./spotify');

const hbs = require("hbs");
app.set("view engine", "hbs");
app.set("views", "views");

/* Routes */

app.use(express.static('public'));


app.get('/', (req, res) => {
  res.redirect('/auth');
});


app.get('/camera', (req, res) => {
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

app.get('/auth', (req, res) => {
  let query = spotify.authQueryStringObject;
  res.redirect("https://accounts.spotify.com/authorize?" + querystring.stringify(query));
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
      spotify.token = data.access_token
      res.redirect('/camera');
    })
    .catch(err => {
      res.send(err.message);
    });
  } else {
   res.send("Error: " + req.query.error);     
  }
});


var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
