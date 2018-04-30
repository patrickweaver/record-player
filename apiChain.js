var rp = require('request-promise-native');

const projectUrl = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';
const googleVision = require('./googleVision');
const spotify = require('./spotify');
const censoredWords = require('./censoredWords');

function askGoogleVision(data, imagePath) {
  return new Promise(async function(resolve, reject) {
    console.log("\nImage: " + projectUrl + imagePath);
    let gcpVisionOptions = googleVision.getGcpOptions(projectUrl + imagePath);
    let gvGuess = await rp(gcpVisionOptions);
    if (gvGuess) {
      data.gvGuess = gvGuess;
      resolve(data);
    } else {
      reject(Error("No response from Google Vision"));
    }
  });
}

function checkGoogleVisionGuess(data) {
  const gvGuess = data.gvGuess;
  console.log(JSON.stringify(gvGuess));
  let guess = gvGuess.responses[0].webDetection.bestGuessLabels[0].label;
  data.gvBestGuess = guess;
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
  data.safeArray = safeArray;
  return data;   
}




async function askSpotifyApi(spotifyToken, data) {
  const safeGuessArray = data.safeArray;
  console.log("\nAsking Spotify");
  console.log(spotifyToken);
  console.log("");
  // Change to iterative (recursive in function below);
  //let albumId = spotifyApiRequest(spotifyToken, safeGuessArray);
  let albumId = false;
  let spotifyData = {};
  let splitSafeGuessArray = splitGuessAtHyphen(safeGuessArray);
  for (var i = splitSafeGuessArray.length; i > 0; i--) {
    spotifyData = await spotifyApiRequest(spotifyToken, splitSafeGuessArray.slice(0, i));
    if (spotifyData.albums && spotifyData.albums.items && spotifyData.albums.items[0]) {
      albumId = spotifyData.albums.items[0].id;
    }
    if (albumId) {
      console.log('\nAlbum Id: ' + JSON.stringify(albumId));
      break;
    }
  }
  
  if (!albumId) {
    console.log('Spotify Error -- Out of words to guess');
    throw('No items: ' + splitSafeGuessArray + '(' + safeGuessArray + ')');
  }
  data.albumId = albumId;
  return data;
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
    return spotifyData;
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


function apiChain(imagePath, req, res) {
  console.log("Image Path: " + imagePath);
  let data = {};
  
  return askGoogleVision(data, imagePath)
  .then(checkGoogleVisionGuess)
  .then(askSpotifyApi.bind(null, req.cookies.spotifyAccessToken))
  .then((data) => {
    data.error = false;
    return data;
  })
  .catch(function (err) {
    console.log(err);
    data.error = true;
    data.errorMessage = err;
    return data;
  });
}

module.exports = apiChain;