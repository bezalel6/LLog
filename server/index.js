require("dotenv").config();
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const cors = require("cors");
const session = require("express-session");
const port = process.env.PORT || 3030;
const app = express();
const oAuth2Client = new OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "postmessage"
);

// app.use(cors({ credentials: true, origin: "*" }));
app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(express.json());
// app.use((req, res, next) => {
//   res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
//   next();
// });
// Setup session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Replace with your own secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: "auto" },
  })
);

app.get("/alive", (req, res) => {
  res.json({ alive: true });
});

app.post("/auth/google", async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.code); // Exchange code for tokens
  console.log(tokens);
  req.session.tokens = tokens; // Save tokens in session
  res.json(tokens);
});

app.get("/auth/google/get-token", async (req, res) => {
  if (!req.session.tokens) {
    console.error("not authenticated");
    return res.status(401).json({ error: "Not authenticated" });
  }

  // If access token is expired, refresh it
  if (Date.now() >= req.session.tokens.expiry_date) {
    console.log("session token expired. regenerating...");
    const { tokens } = await oAuth2Client.refreshToken(
      req.session.tokens.refresh_token
    );
    req.session.tokens = tokens; // Save new tokens in session
  }

  // Send access token to client
  res.json({ access_token: req.session.tokens.access_token });
});

app.listen(port, () => console.log(`Server is running on port ${port}`));