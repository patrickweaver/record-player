const qs = require("qs");

const projectUrl = process.env.PROJECT_URL;

const spotifyApiUrl = "https://api.spotify.com/v1/";
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const redirectPath = "/auth-callback";
const SPOTIFY_REDIRECT_URI = projectUrl + redirectPath;

function queryOptions(spotifyToken, safeGuess) {
  return {
    url: spotifyApiUrl + "search?q=" + safeGuess + "&type=album",
    config: {
      headers: { Authorization: `Bearer ${spotifyToken}` },
    },
  };
}

function authQueryString(state) {
  return {
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: state,
    show_dialog: false,
  };
}

function authOptions(code) {
  const spotifyToken = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
    "utf-8"
  ).toString("base64");
  return {
    url: "https://accounts.spotify.com/api/token",
    data: qs.stringify({
      grant_type: "client_credentials",
      redirect_uri: SPOTIFY_REDIRECT_URI,
      code,
    }),
    config: {
      headers: {
        Authorization: `Basic ${spotifyToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  };
}

function setCookies(res, data) {
  let spotifyAccessOptions = {
    // Spotify sends token in seconds, express wants milliseconds
    // remove 5 seconds to avoid race conditions.
    maxAge: (data.expires_in - 5) * 1000,
  };
  res.cookie("spotifyAccessToken", data.access_token, spotifyAccessOptions);
  if (data.refresh_token) {
    res.cookie("spotifyRefreshToken", data.refresh_token);
  }
}

function refreshOptions(refreshToken) {
  const spotifyToken = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
    "utf-8"
  ).toString("base64");
  return {
    url: "https://accounts.spotify.com/api/token",
    data: qs.stringify({
      grant_type: "refresh_token",
      redirect_uri: SPOTIFY_REDIRECT_URI,
      refresh_token: refreshToken,
    }),
    config: {
      headers: {
        Authorization: `Basic ${spotifyToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  };
}

const embed = [
  '<iframe id="spotify-embed-iframe" src="https://open.spotify.com/embed?uri=spotify:album:',
  '" width="300" height="480" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>',
];

module.exports = {
  queryOptions: queryOptions,
  authQueryString: authQueryString,
  authOptions: authOptions,
  setCookies: setCookies,
  refreshOptions: refreshOptions,
  embed: embed,
};
