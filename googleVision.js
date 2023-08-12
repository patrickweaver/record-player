const gcpApiUrl = 'https://vision.googleapis.com/v1/images:annotate?'
const GCP_API_KEY = process.env.GCP_API_KEY;
const GCP_API_KEY_2 = process.env.GCP_API_KEY_2;

const fs = require('fs');

// function to encode file data to base64 encoded string
function b64req(file) {
  // read binary data
  let image = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(image).toString('base64');
}

async function getGcpOptions(imageUrl) {
  try {
    var imageData = b64req(imageUrl);
  } catch(error) {
    console.log("Error in getGcpOptions with imageUrl:", imageUrl);
    console.log(error);
    return;
  }
  
  // This is a hack to take advantage of free 1000
  // requests per month per Google Cloud Account
  function randomizeKey() {
    if (GCP_API_KEY_2 && (Math.random() > 0.5)) {
      console.log("API KEY 2 at " + new Date())
      return GCP_API_KEY_2;
    }
    console.log("API KEY 1 at " + new Date())
    return  GCP_API_KEY;
  }
  
  return {
    method: 'POST',
    uri: gcpApiUrl + 'key=' + randomizeKey(),
    body: {
      "requests":[
        {
          "image":{
            content: imageData
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
  }
}

module.exports = {
  getGcpOptions: getGcpOptions
}