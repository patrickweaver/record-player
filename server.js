var express = require('express');
var app = express();
var multer  = require('multer');
var upload = multer({ dest: __dirname + '/public/images/' })
var rp = require('request-promise-native');
const querystring = require('querystring');
const url = require('url')
const projectUrl = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';

const googleVision = require('./googleVision');
const spotify = require('./spotify');
var spotifyToken = '';
const censoredWords = require('./censoredWords');

function postGcpVision(imagePath, req, res) {
  var guess = "";
  let gcpVisionOptions = googleVision.getGcpOptions(projectUrl + imagePath);
 
  rp(gcpVisionOptions)
  .then(function (parsedBody) {
    console.log(JSON.stringify(parsedBody));
    guess = parsedBody.responses[0].webDetection.bestGuessLabels[0].label;
    console.log("guess: " + guess);
    let guessArray = guess.split(" ");
    let safeArray = []
    console.log("guessArray: ");
    console.log(guessArray);
    for (var i in guessArray) {
      let safe = true;
      if (censoredWords.censoredWords.indexOf(guessArray[i]) > -1) {
        safe = false; 
      }
      if (safe) {
        safeArray.push(guessArray[i]); 
      } else {
        // Need to add these to a DB
        console.log("NOT SAFE");
        console.log(guessArray[i]);
      }
    }
    console.log("safeArray: ");
    console.log(safeArray);  
    return safeArray.join(" ");
    
  })
  .then(async function (safeGuess) {
    
    let spotifyQueryOptions = spotify.queryOptions(spotifyToken, safeGuess);
    
    let url = await rp(spotifyQueryOptions)
    .then(function(spotifyData) {
      console.log("spotifyData: ");
      console.log(JSON.stringify(spotifyData));
      if (spotifyData.albums.items.length === 0) {
        throw("No items: " + JSON.stringify(spotifyData)); 
      }
      let url = spotifyData.albums.items[0].external_urls.spotify;
      //res.send("<a href='" + url + "' target='_blank'>" + url + "</a>");
      return url;
    })
    .catch(function(err) {
      console.log("SpotifyError");
      throw(err);
    });
    return url;
  })
  .then(function(url) {
    res.redirect(url);
  });
  .catch(function (err) {
    console.log("GCP Error");
    console.log(err);
    res.send(err);
  });
}


/* Routes */

app.use(express.static('public'));


app.get('/', (req, res) => {
  res.redirect('/auth');
});


app.get('/player', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/player', upload.single('file'), function(req, res) {
  let imagePath = "/images/" + req.file.filename;
  postGcpVision(imagePath, req, res);
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
      spotifyToken = data.access_token
      res.redirect('/player');
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
