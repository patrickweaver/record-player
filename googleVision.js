const gcpApiUrl = 'https://vision.googleapis.com/v1/images:annotate?'
const GCP_API_KEY = process.env.GCP_API_KEY;
const b64req = require('request-promise-native').defaults({
  encoding: 'base64'
})

async function getGcpOptions(imageUrl) {
  console.log(imageUrl);
  let imageData = await b64req({uri: imageUrl});
  return {
    method: 'POST',
    uri: gcpApiUrl + 'key=' + GCP_API_KEY,
    body: {
      "requests":[
        {
          "image":{
            content: imageData
            /*
            "source": {
              "imageUri": imageUrl
            }
            */
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