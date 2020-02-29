const commands = [
  require("./help"),
  require("./notes"),
  require("./check")
];
const options = commands.map(command => command.command);

module.exports = {
  commands,
  options,
} 