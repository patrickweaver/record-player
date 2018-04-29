var rp = require('request-promise-native');

const projectUrl = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';
const googleVision = require('./googleVision');
const spotify = require('./spotify');
const censoredWords = require('./censoredWords');

function askGoogleVision(imagePath) {
  return new Promise(async function(resolve, reject) {
    let gcpVisionOptions = googleVision.getGcpOptions(projectUrl + imagePath);
    let gvGuess = await rp(gcpVisionOptions);
    if (gvGuess) {
      resolve(gvGuess);
    } else {
      reject(Error("No response from Google Vision"));
    }
  });
}

function checkGoogleVisionGuess(gvGuess) {
  console.log(JSON.stringify(gvGuess));
  let guess = gvGuess.responses[0].webDetection.bestGuessLabels[0].label;
  console.log("guess: " + guess);
  let guessArray = guess.split(" ");
  let safeArray = []
  console.log("guessArray: ");
  console.log(guessArray);
  for (var i in guessArray) {
    let safe = true;
    if (censoredWords.censoredWords.indexOf(guessArray[i]) > -1) {
      safe = false; 
    }
    if (safe) {
      safeArray.push(guessArray[i]); 
    } else {
      // Need to add these to a DB
      console.log("NOT SAFE");
      console.log(guessArray[i]);
    }
  }
  console.log("safeArray: ");
  console.log(safeArray);  
  return safeArray;   
}

function askSpotifyApi(safeGuessArray) {
  async function spotifyApiRequest(safeGuessArray) {
    let safeGuess = safeGuessArray.join(" ");
    if (safeGuess.length > 0) {
      let spotifyQueryOptions = spotify.queryOptions(spotify.token, safeGuess);
      let spotifyData = await rp(spotifyQueryOptions);
      if (spotifyData.albums.items.length === 0) {
        return spotifyApiRequest(safeGuessArray.splice(-1, 1));
      } else {
        let url = spotifyData.albums.items[0].external_urls.spotify;
        return url;
      }
    } else {
      console.log("SpotifyError");
      throw("No items: " + JSON.stringify(spotifyData));
    }
  }
  
  let spotifyData = spotifyApiRequest(safeGuessArray);
  return spotifyData;
}

module.exports = function(imagePath, req, res) {
  return askGoogleVision(imagePath)
  .then(checkGoogleVisionGuess)
  .then(askSpotifyApi)
  .then((url) => {
    return {error: false, url: url};
  })
  .catch(function (err) {
    console.log("GCP Error");
    console.log(err);
    return {error: true, errorMessage: err};
  });
}