const { parseCommandLine } = require("yaclip");
const notes = require("./src/notes");
const check = require("./src/check");

const COMMAND_NOTES = "notes"
const COMMAND_CHECK = "check"

const options = [
  { name: COMMAND_NOTES, alias: "n", type: Boolean, multiple: false, subcommands: notes.options },
  { name: COMMAND_CHECK, alias: "c", type: Boolean, multiple: false, subcommands: check.options },
]

const command = parseCommandLine(options, { dashesAreOptional: true });

try {
  if (command.notes) {
    notes.command(command[COMMAND_NOTES]);
  } else if (command.check) {
    check.command(command[COMMAND_CHECK]);
  }
}
catch (error) {
  console.error(`Error: ${error.message}`)
}