const userscontroller = require("../controllers").users;
const usertypescontroller = require("../controllers").usertypes;

const multer = require("multer");
const passport = require("passport");
var fs = require("fs-extra");

require("../middleware/passport.middleware")(passport);

const middleware = function (req, res, next) {
  // requires auth
  passport.authenticate(
    "jwt",
    {
      session: false,
    },
    function (err, user, info) {
      req.authenticated = !!user;
      req.user = user;

      if (!user) {
        return res.send("authentication required for this call");
      }
      next();
    }
  )(req, res, next);
};

const omiddleware = function (req, res, next) {
  // middleware with optional auth
  passport.authenticate(
    "jwt",
    {
      session: false,
    },
    function (err, user, info) {
      req.authenticated = !!user;
      req.user = user;
      next();
    }
  )(req, res, next);
};

var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    let path = "";
    path = `./public`;
    fs.mkdirsSync(path);
    callback(null, path);
  },
  filename: async function (req, file, cb) {
    var datetimestamp = Date.now();
    cb(
      null,
      file.fieldname +
        "-" +
        datetimestamp +
        "." +
        file.originalname.split(".")[file.originalname.split(".").length - 1]
    );
  },
});

const upload = multer({
  storage: storage,
  onError: (err, next) => {
    console.log("error", err);
    next(err);
  },
});

module.exports = (app) => {
  app.get("/wapi/usertypes/:id?", middleware, usertypescontroller.index);
  app.post("/wapi/usertypes/add", middleware, usertypescontroller.add);
  app.post("/wapi/usertypes/edit", middleware, usertypescontroller.edit);
  app.post("/wapi/usertypes/delete", middleware, usertypescontroller.delete);
  app.post(
    "/wapi/usertypes/toggleUserType",
    usertypescontroller.toggleUserType
  );

  // User
  app.get("/wapi/users", middleware, userscontroller.index);

  app.post("/wapi/users/paginate", middleware, userscontroller.paginate);
  app.post("/wapi/me", middleware, userscontroller.refreshToken);

  app.post("/wapi/login", userscontroller.login);
  app.post("/wapi/users/add", middleware, userscontroller.signup);
  app.post("/wapi/users/edit", middleware, userscontroller.edit);
  app.post("/wapi/users/delete", middleware, userscontroller.delete);
  app.post("/wapi/users/toggleUser", middleware, userscontroller.toggleUser);
  app.post(
    "/wapi/users/bulkEditStatus",
    middleware,
    userscontroller.bulkEditStatus
  );
  app.post("/wapi/change-password", middleware, userscontroller.changePassword);
};
