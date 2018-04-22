var express = require('express');
var app = express();

app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(req);
  console.log("Hello");
  next();
});

app.get("/", (req, res) => {
  res.sendFile('/app/views/index.html');
});


var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
