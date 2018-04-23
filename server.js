var express = require('express');
var app = express();
var multer  = require('multer');
var upload = multer({ dest: __dirname + '/public/images/' })
var rp = require('request-promise-native');

const GCP_API_KEY = process.env.GCP_API_KEY;

function postGcpVision(imagePath) {
  var options = {
    method: 'POST',
    uri: 'https://vision.googleapis.com/v1/images:annotate?key=' + GCP_API_KEY,
    body: {
      "requests":[
        {
          "image":{
            "content":"imagePath"
          },
          "features":[
            {
              "type":"LABEL_DETECTION",
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
      // POST succeeded...
  })
  .catch(function (err) {
      // POST failed...
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
  res.send("<img src='/images/" + req.file.filename + "'>");
});



var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
