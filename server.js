var express = require('express');
var app = express();
var multer  = require('multer');
var upload = multer({ dest: __dirname + '/public/images/' })
var rp = require('request-promise-native');
const querystring = require('querystring');
const url = require('url')

const gcpApiUrl = 'https://vision.googleapis.com/v1/images:annotate?'
const GCP_API_KEY = process.env.GCP_API_KEY;

const projectUrl = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';
const redirectPath = '/b';
const stateString = 'abc123';

const spotifyApiUrl = '	https://api.spotify.com/v1/';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

function postGcpVision(imagePath, req, res) {
  
  var guess = "";
  let gcpVisionOptions = {
    method: 'POST',
    uri: gcpApiUrl + 'key=' + GCP_API_KEY,
    body: {
      "requests":[
        {
          "image":{
            "source": {
              "imageUri": projectUrl + imagePath
            }
          },
          "features":[
            {
              "type":"WEB_DETECTION",
              "maxResults":1
            }
          ]
        }
      ]
    },
    json: true // Automatically stringifies the body to JSON
  };
 
  rp(gcpVisionOptions)
  .then(function (parsedBody) {
    console.log(JSON.stringify(parsedBody));
    guess = parsedBody.responses[0].webDetection.bestGuessLabels[0].label;
    console.log(guess);
  })
  .then(function () {
    let spotifyOptions = {
      method: 'GET',
      uri: spotifyApiUrl + 'search?q=' + guess + '&type=Album',
      json: true,
      auth: {
          'bearer': process.env.token
      }
    } 
    
    rp(spotifyOptions)
    .then(function(spotifyData) {
      let url = spotifyData.albums.items[0].external_urls.spotify;
      //res.send("<a href='" + url + "' target='_blank'>" + url + "</a>");
      res.redirect(url);
    })
    .catch(function(err) {
      console.log("SpotifyError");
      throw(err);
    });
    
  })
  .catch(function (err) {
    console.log("GCP Error");
    console.log(err);
    res.send(err);
  });
}





app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/', upload.single('file'), function(req, res) {
  //res.send(req.file);
  let imagePath = "/images/" + req.file.filename;
  //res.send("<img src=" + imagePath + "'>");
  postGcpVision(imagePath, req, res);
});

app.get('/a', (req, res) => {
  let query = {
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "token",
    redirect_uri: projectUrl + redirectPath,
    state: stateString,
    show_dialog: false
  }
  
  
  res.redirect("https://accounts.spotify.com/authorize?" + querystring.stringify(query));
});

app.get('/b', (req, res) => {
  var a = req.originalUrl;
  console.log(a);
  res.send('<script>window.location="/c"</script>'); 
});

app.get('/c', (req, res) => {
  
});



var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
