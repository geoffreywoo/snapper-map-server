function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

define("APPS", {
  SNAPPERMAP: "snappermap",
  PUFFERCHAT: "pufferchat"
});

define("COLLECTIONS", {
  PUFFER: "Puffers"
});

define("CLIENT_APP_MODES", {
  DEVELOPMENT: "development",
  PRODUCTION: "production"
});
