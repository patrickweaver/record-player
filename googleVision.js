const fs = require("fs");

const gcpApiUrl = "https://vision.googleapis.com/v1/images:annotate?";
const GCP_API_KEY = process.env.GCP_API_KEY;
// Setting this is optional
const GCP_API_KEY_2 = process.env.GCP_API_KEY_2;

// function to encode file data to base64 encoded string
function b64req(file) {
  // read binary data
  let image = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return Buffer.from(image).toString("base64");
}

async function getGcpOptions(imageUrl) {
  let imageData;
  try {
    imageData = b64req(imageUrl);
  } catch (error) {
    console.log("Error in getGcpOptions with imageUrl:", imageUrl);
    console.log(error);
    return;
  }

  // This is a hack to split the free 1000 requests per month over two Google
  // Cloud accounts
  function randomizeKey() {
    if (GCP_API_KEY_2 && Math.random() > 0.5) {
      return GCP_API_KEY_2;
    }
    return GCP_API_KEY;
  }

  return {
    url: `${gcpApiUrl}key=${randomizeKey()}`,
    data: {
      requests: [
        {
          image: { content: imageData },
          features: [{ type: "WEB_DETECTION", maxResults: 1 }],
        },
      ],
    },
  };
}

module.exports = {
  getGcpOptions,
};
