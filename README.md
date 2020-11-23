# Record Player

This is a [Rube Goldberg Machine](https://en.wikipedia.org/wiki/Rube_Goldberg_machine) of the [Google Cloud Vision API](https://cloud.google.com/vision/) and the [Spotify API](https://beta.developer.spotify.com/documentation/web-api/). After logging into Spotify, upload an image. The image will be sent to the Google Vision API, which will guess what it is. The app will then search Spotify using Google's guess, and give you the first result to play.

There are a few environment variables you will have to set when running this locally or on a server. 

## External Services:
You will need the following to make your own:

- [Google Cloud API Key](https://cloud.google.com/docs/authentication/api-keys) (this is set as GCP_API_KEY ENV variable)
- Create a [Spotify App](https://beta.developer.spotify.com/dashboard/applications) (SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET ENV variables)

### Google Cloud:

1. Register a Google Cloud Platform account.
2. Create a new project.
3. Create Credentials for your project from the dashboard of Google Cloud Platform.
  - You want API Key credentials, not `OAuth 2.0 Client IDs` or `Service Accounts` credentails. If you only see those two you are not in the right place.
  - It is a good idea to restrict your credentials access to only the Cloud Vision API.
4. Add your Google Cloud API Key as GCP_API_KEY in a .env file.
5. You may need to enable the Google Vision API in GCP.
6. You will need to enable billing for the GCP project for the vision API to work.

![](https://record-player.glitch.me/docs/google-cloud-api-key-restrictions.png)
[View Image](https://record-player.glitch.me/docs/google-cloud-api-key-restrictions.png)

### Spotify:

1. Register a Spotify Developer account (you can use the same credentials as your streaming account, even if it is on the free tier).
2. Create a new Spotify App, give it a name and description
3. Add the following settings to your app:
  - Website: The website where you will host the app (you can run the app at different websites or locally without updating this.)
  - Redirect URIs: This is required to make the Spotify login work. It should be the protocol your site is hosted with + the root url of your site + "/auth-callback". For example: "https://record-player.glitch.me/auth-callback". You can add more than one so you can run locally or at multiple sites. See image below:

![](https://record-player.glitch.me/docs/spotify-app-settings-example.png)
[View Image](https://record-player.glitch.me/docs/spotify-app-settings-example.png)