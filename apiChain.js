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
  console.log('safeArray: ');
  console.log(safeArray);  
  return safeArray;   
}




async function askSpotifyApi(spotifyToken, safeGuessArray) {
  console.log("\nAsking Spotify");
  console.log(spotifyToken);
  console.log("");
  // Change to iterative (recursive in function below);
  //let albumId = spotifyApiRequest(spotifyToken, safeGuessArray);
  let albumId = false;
  let splitSafeGuessArray = splitGuessAtHyphen(safeGuessArray);
  for (var i = splitSafeGuessArray.length; i > 0; i--) {
    albumId = await spotifyApiRequest(spotifyToken, splitSafeGuessArray.slice(0, i))
    if (albumId) {
      console.log('\nAlbum Id: ' + JSON.stringify(albumId));
      break;
    }
  }
  
  if (!albumId) {
    console.log('Spotify Error -- Out of words to guess');
    throw('No items: ' + splitSafeGuessArray + '(' + safeGuessArray + ')');
  }
  
  return albumId;
}

async function spotifyApiRequest(spotifyToken, splitSafeGuessArray) {
  console.log("Asking with: " + splitSafeGuessArray);
  let safeGuess = splitSafeGuessArray.join(" ");
  let spotifyQueryOptions = spotify.queryOptions(spotifyToken, safeGuess);
  let spotifyData = await rp(spotifyQueryOptions);
  console.log('\nSpotify Data:');
  console.log(JSON.stringify(spotifyData));
  if (spotifyData.albums.items.length === 0) {
    console.log("No Items");
    return false;
  } else {
    let albumId = spotifyData.albums.items[0].id;
    return albumId;
  }
}

// This function throws away everything before a hyphen (-) character
// from the Google Vision guess. This is because on a few example
// queries it was adding things like the record label name along with the
// artist which was confusing the spotify API.
function splitGuessAtHyphen(safeGuessArray) {
  let splitArray = safeGuessArray;
  if (safeGuessArray.length > 0) {
    let hyphenIndex = safeGuessArray.indexOf('-');  
    if (hyphenIndex > -1) {
      splitArray = safeGuessArray.slice(hyphenIndex + 1, safeGuessArray.length);
    }
    console.log("Split Array:");
    console.log(splitArray);
  }
  return splitArray;
}


module.exports = function(imagePath, req, res) {
  return askGoogleVision(imagePath)
  .then(checkGoogleVisionGuess)
  .then(askSpotifyApi.bind(null, req.cookies.spotifyAccessToken))
  .then((albumId) => {
    return {error: false, albumId: albumId};
  })
  .catch(function (err) {
    console.log("GCP Error");
    console.log(err);
    return {error: true, errorMessage: err};
  });
}