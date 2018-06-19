var rp = require('request-promise-native');

const projectUrl = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';

const spotifyApiUrl = 'https://api.spotify.com/v1/';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const redirectPath = '/auth-callback';
const SPOTIFY_REDIRECT_URI = 'http://localhost:3000' + redirectPath;

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

function apiOptions(spotifyToken) {
  return {
    method: 'GET',
    uri: spotifyApiUrl + 'me/player/devices',
    json: true,
    auth: {
      'bearer': spotifyToken
    }
  }
}

function apiPlaybackOptions(spotifyToken, albumId, deviceId) {
  var options = {
    method: 'PUT',
    uri: spotifyApiUrl + 'me/player/play' + '?device_id=' + deviceId,
    json: true,
    auth: {
      'bearer': spotifyToken
    },
    body: {
      context_uri: 'spotify:album:' + albumId
    }
  }
  //console.log(JSON.stringify(options));

  return options;
}


function authQueryString(state) {
  return {
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: state,
    scope: 'user-modify-playback-state user-read-playback-state streaming',
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

const embed = ['<iframe src="https://open.spotify.com/embed?uri=spotify:album:', '" width="300" height="480" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>'];


module.exports = {
  queryOptions: queryOptions,
  authQueryString: authQueryString,
  apiPlaybackOptions: apiPlaybackOptions,
  apiOptions: apiOptions,
  authOptions: authOptions,
  setCookies: setCookies,
  refreshOptions: refreshOptions,
  embed: embed
}
