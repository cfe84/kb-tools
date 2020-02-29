const { parseCommandLine } = require("yaclip");
const { options, commands } = require("./commands/commandIndex");


const getCommand = () => {
  try {
    return parseCommandLine(options, { dashesAreOptional: true });
  } catch (error) {
    console.error(`Error parsing command: ${error.message}`)
  }
}

const execCommand = (command) => {
  try {
    const selectedOption = commands.find((option) => !!command[option.command.name]);
    if (!selectedOption) {
      throw error("Command not found")
    }
    const commandOptions = command[selectedOption.command.name]
    selectedOption.exec(commandOptions)
  }
  catch (error) {
    console.error(`Error executing command: ${error.message}`)
  }
}

const execCommandLine = () => {
  const command = getCommand();
  if (command) {
    execCommand(command);
  } else {
  }
}

module.exports = execCommandLine