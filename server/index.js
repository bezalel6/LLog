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
// app.use(cors({ credentials: true, origin: "http://localhost:5173" }));

const allowedOrigins = ["http://localhost:5173", "https://llog-9e6bc.web.app/"];

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.get("Origin"));
  res.header("Access-Control-Allow-Credentials", "true"); // Set to 'true' to allow credentials
  // Other CORS headers if needed
  next();
});
// Rest of your server code

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      console.log("got origin", origin);
      if (!origin || allowedOrigins.find((o) => o.includes(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

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
  try {
    const { tokens } = await oAuth2Client.getToken(req.body.code); // Exchange code for tokens
    console.log(tokens);
    req.session.tokens = tokens; // Save tokens in session
    res.json(tokens);
  } catch (e) {
    console.error("error trying to get tokens. e=" + e);
    return res.status(401).json({ error: e });
  }
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
