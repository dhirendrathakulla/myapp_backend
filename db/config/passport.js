const LocalStrategy = require("passport-local").Strategy;

// Load User model
const User = require("../models").User;

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "username" },
      (username, password, done) => {
        // Match user
        User.findOne({
          where: { username: username },
        }).then((user) => {
          if (!user) {
            return done(null, false, {
              message: "That username is not registered",
            });
          }

          // Match password
          const result = user.correctPassword(password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Password incorrect" });
          }
        });
      }
    )
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    User.findOne({
      where: { id: id },
    })
      .then((user) => {
        done(null, user);
      })
      .catch((err) => done(err, null));
  });
};
