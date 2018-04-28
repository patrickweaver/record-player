const projectUrl = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';

const spotifyApiUrl = 'https://api.spotify.com/v1/';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const redirectPath = '/b';
const SPOTIFY_REDIRECT_URI = projectUrl + redirectPath;

function queryOptions(spotifyToken, safeGuess) {
  return {
    method: 'GET',
    uri: spotifyApiUrl + 'search?q=' + safeGuess + '&type=Album',
    json: true,
    auth: {
        'bearer': spotifyToken
    }
  }
}

const stateString = 'abc123';

const authQueryStringObject = {
  client_id: SPOTIFY_CLIENT_ID,
  response_type: "code",
  redirect_uri: SPOTIFY_REDIRECT_URI,
  state: stateString,
  show_dialog: false
}

function authOptions(code) {
    return {
    method: 'POST',
    uri: 'https://accounts.spotify.com/api/token',
    form: {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      client_id: SPOTIFY_CLIENT_ID,
      client_secret: SPOTIFY_CLIENT_SECRET,
    },
    json: true
  } 
}


module.exports = {
  queryOptions: queryOptions,
  stateString: stateString,
  authQueryStringObject: authQueryStringObject,
  authOptions: authOptions
}




