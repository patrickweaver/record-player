var rp = require('request-promise');

const projectUrl = process.env.PROJECT_URL;

const spotifyApiUrl = 'https://api.spotify.com/v1/';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const redirectPath = '/auth-callback';
const SPOTIFY_REDIRECT_URI = projectUrl + redirectPath;

function queryOptions(spotifyToken, safeGuess) {
  return {
    method: 'GET',
    uri: spotifyApiUrl + 'search?q=' + safeGuess + '&type=album',
    json: true,
    auth: {
        'bearer': spotifyToken
    }
  }
}

function authQueryString(state) {
  return {
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: state,
    show_dialog: false
  }
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

function setCookies(res, data) {
  let spotifyAccessOptions = {
    // Spotify sends token in seconds, express wants milliseconds
    // remove 5 seconds to avoid race conditions.
    maxAge: (data.expires_in - 5) * 1000
  }
  res.cookie('spotifyAccessToken', data.access_token, spotifyAccessOptions);
  if (data.refresh_token) {
    res.cookie('spotifyRefreshToken', data.refresh_token);
  }
}

function refreshOptions(refreshToken) {
  return {
    method: 'post',
    uri: 'https://accounts.spotify.com/api/token',
    form: {
      grant_type:	'refresh_token',
      refresh_token: refreshToken,
      client_id: SPOTIFY_CLIENT_ID,
      client_secret: SPOTIFY_CLIENT_SECRET,
    },
    json: true
  }
}

const embed = ['<iframe id="spotify-embed-iframe" src="https://open.spotify.com/embed?uri=spotify:album:', '" width="300" height="480" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>'];


module.exports = {
  queryOptions: queryOptions,
  authQueryString: authQueryString,
  authOptions: authOptions,
  setCookies: setCookies,
  refreshOptions: refreshOptions,
  embed: embed
}




