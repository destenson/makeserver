const http = require("http");
const config = require("./config");
const watcher = require("./watcher");
const compiler = require("./compiler");
const log = require("./log");

const port = config.port;

const server = http.createServer((req, res) => {

  let cmd = req.url.substr(1);

  if(cmd == "compile")
    compiler.link();
  else if(cmd === "run")
    compiler.run();
  else if(cmd === "crun")
    compiler.crun();

  res.end("Ok");
});

server.on("listening", () => {
  log.i("Server ready, listening on port " + port);
});

function run()
{

  compiler.init().then(() => {
    return watcher.init()
  })

  .then(() => {
    server.listen(port);
  })

  .catch((err) => {
    log.e(err);
  });
}

module.exports = {
  run
};
