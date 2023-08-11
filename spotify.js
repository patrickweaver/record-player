const qs = require("qs");

const projectUrl = process.env.PROJECT_URL;
const spotifyApiUrl = "https://api.spotify.com/v1/";
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectPath = "/auth-callback";
const redirect_uri = projectUrl + redirectPath;

function getToken(id, secret) {
  return Buffer.from(`${id}:${secret}`, "utf-8").toString("base64");
}

function queryOptions(token, safeGuess) {
  return {
    url: `${spotifyApiUrl}search?q=${safeGuess}&type=album`,
    config: {
      headers: { Authorization: `Bearer ${token}` },
    },
  };
}

function authQueryString(state) {
  return {
    client_id: client_id,
    response_type: "code",
    redirect_uri,
    state,
    show_dialog: false,
  };
}

function authOptions(code) {
  return {
    url: "https://accounts.spotify.com/api/token",
    data: qs.stringify({
      grant_type: "client_credentials",
      redirect_uri,
      code,
    }),
    config: {
      headers: {
        Authorization: `Basic ${getToken(client_id, client_secret)}`,
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

function refreshOptions(refresh_token) {
  return {
    url: "https://accounts.spotify.com/api/token",
    data: qs.stringify({
      grant_type: "refresh_token",
      redirect_uri,
      refresh_token,
    }),
    config: {
      headers: {
        Authorization: `Basic ${getToken(client_id, client_secret)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  };
}

function getEmbed(albumId) {
  return `<iframe id="spotify-embed-iframe" src="https://open.spotify.com/embed?uri=spotify:album:${albumId}" width="300" height="480" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
}

module.exports = {
  queryOptions,
  authQueryString,
  authOptions,
  setCookies,
  refreshOptions,
  getEmbed,
};
