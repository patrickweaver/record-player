var rp = require('request-promise-native');

const projectUrl = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';
const googleVision = require('./googleVision');
const spotify = require('./spotify');
const censoredWords = require('./censoredWords');

function checkSpotifyData(spotifyData) {
  console.log("spotifyData: ");
  console.log(JSON.stringify(spotifyData));
  if (spotifyData.albums.items.length === 0) {
    throw("No items: " + JSON.stringify(spotifyData)); 
  }
  let url = spotifyData.albums.items[0].external_urls.spotify;
  return url;
}


module.exports = async function(imagePath, req, res) {
  var guess = "";
  let gcpVisionOptions = googleVision.getGcpOptions(projectUrl + imagePath);
  
  let url = await rp(gcpVisionOptions)
  .then(function (parsedBody) {
    console.log(JSON.stringify(parsedBody));
    guess = parsedBody.responses[0].webDetection.bestGuessLabels[0].label;
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
    return safeArray.join(" ");
    
  })
  .then(async function (safeGuess) {
    
    let spotifyQueryOptions = spotify.queryOptions(spotify.token, safeGuess);
    
    let url = await rp(spotifyQueryOptions)
    .then(checkSpotifyData)
    .catch(function(err) {
      console.log("SpotifyError");
      throw(err);
    });
    console.log("url: " + url);
    return url;
  })
  .then(function(url) {
    return {error: false, url: url};
  })
  .catch(function (err) {
    console.log("GCP Error");
    console.log(err);
    res.send(err);
    return {error: true, errorMessage: err};
  });
  
  return url;
}