var express = require('express');
var app = express();
var multer  = require('multer');
var upload = multer({ dest: __dirname + '/public/' })

const GCP_API_KEY = process.env.GCP_API_KEY;

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
  res.send("<img src='/" + req.file.filename + "'>");
});



var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
