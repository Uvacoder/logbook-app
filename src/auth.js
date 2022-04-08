const passport = require("passport");
const GithubStrategy = require("passport-github2").Strategy;
const User = require("./models/User");

/* passport generic */

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (_id, done) => {
  try {
    const user = await User.findOne({ _id });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

/* Github auth */

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async function (
      _accessToken,
      _refreshToken,
      profile,
      done
    ) {
      const githubId = +profile.id;
      console.log("github auth callback githubId=" + profile.id + " username=" + profile.username);

      try {
        const user = await User.findOneAndUpdate({ githubId }, {
          githubId,
          githubUsername: profile.username,
        }, {upsert: true, new: true})
        done(null, user);
      } catch (err) {
        const message = "Failed to sign in github user githubId=" + githubId;
        console.error(message + " " + err.message);
        done(err);
      }
    }
  )
);

module.exports = {
  passport,
}
