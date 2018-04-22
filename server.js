var express = require('express');
var app = express();
var multer  = require('multer');
app.use(require('body-parser').urlencoded({ extended: true }));
var memoryStorage = multer.memoryStorage();
var memoryUpload = multer({
	storage: memoryStorage,
	limits: {
		filesize: 20*1024*1024,
		files: 1
	}
}).single("file");
//var upload = multer({ dest: __dirname + '/uploads/' })

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

app.post('/', memoryUpload, (req, res) => {
  console.log(req.body.t);
  res.send(req.file.originalname);
});



var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
