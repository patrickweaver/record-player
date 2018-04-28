const projectUrl = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';

const spotifyApiUrl = 'https://api.spotify.com/v1/';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const redirectPath = '/b';
const SPOTIFY_REDIRECT_URI = projectUrl + redirectPath;

function spotifyQueryOptions(spotifyToken, safeGuess) {
  return {
    method: 'GET',
    uri: spotifyApiUrl + 'search?q=' + safeGuess + '&type=Album',
    json: true,
    auth: {
        'bearer': spotifyToken
    }
  }
} 



module.exports = {
  spotifyQueryOptions: spotifyQueryOptions 
}




