const http = require("http");

function sendCommand(port, cmd)
{
  http.get({
    hostname: "localhost",
    port,
    path: "/" + cmd,
    agent: false
  }, (()=>{}));
}

module.exports = {
  sendCommand
};
