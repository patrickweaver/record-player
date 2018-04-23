var express = require('express');
var app = express();
var multer  = require('multer');
var upload = multer({ dest: __dirname + '/public/images/' })
var rp = require('request-promise-native');

const GCP_API_KEY = process.env.GCP_API_KEY;
const projectUrl = "https://" + process.env.PROJECT_DOMAIN + ".glitch.me/"

function postGcpVision(imagePath, req, res) {
  var options = {
    method: 'POST',
    uri: 'https://vision.googleapis.com/v1/images:annotate?key=' + GCP_API_KEY,
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
 
  rp(options)
  .then(function (parsedBody) {
    console.log(parsedBody);
    res.send(parsedBody);
  })
  .catch(function (err) {
    console.log(err);
    res.send(err);
  });
  
}





app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(req.file);
  console.log('Hello');
  next();
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/', upload.single('file'), function(req, res) {
  //res.send(req.file);
  let iamgePath = "/images/" + req.file.feilname
  //res.send("<img src='/images/" + req.file.filename + "'>");
  postGcpVision(
});

app.get('/env', (req, res) => {
  res.send(process.env.PROJECT_DOMAIN);
});



var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
