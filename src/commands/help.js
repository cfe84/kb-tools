const usage = require("command-line-usage");
const helpCommand = { name: "help", alias: "h", type: Boolean, multiple: false };

const help = () => {
  const commandIndex = require("./commandIndex");
  const optionList = commandIndex.options;
  const content = 'Allows you to manage your knowledge db'
  displayHelp(content, optionList);
}

function displayHelp(content, optionList) {
  const structure = [
    {
      header: 'Knowledge Db command line',
      content
    },
    {
      header: 'Commands',
      optionList
    }
  ];
  const message = usage(structure);
  console.log(message);
}

module.exports = {
  command: helpCommand,
  exec: help,
  displayHelp
}

