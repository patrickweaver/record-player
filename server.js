var express = require('express');
var app = express();
var multer  = require('multer')
var upload = multer({ dest: __dirname + '/uploads/' })

const GCP_API_KEY = process.env.GCP_API_KEY;

app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(req);
  console.log('Hello');
  next();
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/', upload.single('cover'), (req, res) => {
  
  
  
});



var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
