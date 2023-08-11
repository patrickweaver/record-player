const express = require("express");
const cookieParser = require("cookie-parser");
const hbs = require("hbs");
const multer = require("multer");
const axios = require("axios");
const qs = require("qs");
const fs = require("fs");

const apiChain = require("./apiChain");
const spotify = require("./spotify");

const projectUrl = process.env.PROJECT_URL;
const note = process.env.NOTE;
const analyticsUrl = process.env.ANALYTICS_URL;

const defaultLocals = {
  projectUrl,
  note,
  analyticsUrl,
};

const app = express();
app.use(cookieParser());
app.use(express.static("public"));
app.set("view engine", "hbs");
app.set("views", "views");
hbs.registerPartials(__dirname + "/views/partials/");
const upload = multer({ dest: __dirname + "/public/uploaded-images/" });

// Explains the app and has Spotify login link
app.get("/auth", function (_req, res) {
  const stateString = process.env.SPOTIFY_STATE_STRING;
  res.cookie("spotifyStateString", stateString);
  const query = spotify.authQueryString(stateString);
  const authUrl =
    "https://accounts.spotify.com/authorize?" + qs.stringify(query);
  res.render("auth", {
    authUrl,
    loggedOut: true,
    ...defaultLocals,
  });
});

// Spotify redirects to this url, it sets cookies, then redirects
app.get("/auth-callback", async function (req, res) {
  const { error, state, code } = req.query;
  if (error || !state || state !== req.cookies.spotifyStateString)
    handleError(res, "Wrong spotify auth code");
  try {
    const { url, data, config } = spotify.authOptions(code);
    const response = await axios.post(url, data, config);
    spotify.setCookies(res, response.data);
    res.redirect("/");
  } catch (err) {
    handleError(res, err);
  }
});

// Logs out of Spotify, then redirects
app.get("/logout", (_req, res) => {
  res.clearCookie("spotifyAccessToken");
  res.clearCookie("spotifyRefreshToken");
  res.redirect("/");
});

// Checks for login cookie, if it doesn't find it redirects
app.use(async function (req, res, next) {
  if (req.cookies.spotifyAccessToken) {
    next();
    return;
  }
  if (!req.cookies.spotifyRefreshToken) return res.redirect("/auth");
  try {
    const { url, data, config } = spotify.refreshOptions(
      req.cookies.spotifyRefreshToken
    );
    const response = await axios.post(url, data, config);
    spotify.setCookies(res, response.data);
    next();
  } catch (err) {
    handleError(res, err);
  }
});

// Camera is default view, unless not logged in
app.get("/", function (_req, res) {
  res.render("camera", defaultLocals);
});

// This route works for both the async request from the frontend
// or as a form submission if the fancy uploader doesn't work (no js).
// At the end the image is deleted from the server
app.post("/player", upload.single("file"), async function (req, res) {
  let apiResponse;
  let imagePath = false;
  if (req.file && req.file.filename) {
    imagePath = "/uploaded-images/" + req.file.filename;
  } else {
    apiResponse = {
      error: true,
      errorMessage: "No image file.",
    };
  }

  if (imagePath) {
    try {
      apiResponse = await apiChain(imagePath, req, res);
      if (apiResponse.error) {
        throw "No albums found.";
      }
    } catch (e) {
      apiResponse = {
        error: true,
        errorMessage: "API requests failed or no albums found.",
      };
    }
  }

  if (apiResponse.error) {
    if (req.body.async) {
      res.json({
        error: true,
        errorMessage: apiResponse.errorMessage,
      });
    } else {
      handleError(res, "Error: " + apiResponse.errorMessage);
    }
  }
  if (req.body.async) {
    res.json({
      error: false,
      googleVisionGuess: apiResponse.gvBestGuess,
      albumId: apiResponse.albumId,
    });
  } else {
    res.render("player", {
      googleVisionGuess: apiResponse.gvBestGuess,
      embed: spotify.embed[0] + apiResponse.albumId + spotify.embed[1],
      ...defaultLocals,
    });
  }
  // Delete image
  if (imagePath) {
    try {
      fs.unlinkSync("./public" + imagePath);
    } catch (err) {
      console.log("error deleting " + "./app/public" + imagePath + ": " + err);
    }
  }
});

// Once the async apiChain request returns, frontend redirects to player
// with Spotify album ID as query string parameter
app.get("/player", function (req, res) {
  const { albumId, googleVisionGuess } = req.query;
  if (!albumId || !googleVisionGuess) res.redirect("/");
  res.render("player", {
    googleVisionGuess,
    embed: spotify.embed[0] + req.query.albumId + spotify.embed[1],
    ...defaultLocals,
  });
});

// General error handling
function handleError(res, err) {
  console.log("\nError:");
  console.log(JSON.stringify(err));
  console.log({ err });
  res.redirect("/error");
}

app.get("/error", function (_req, res) {
  res.render("error", defaultLocals);
});

const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
