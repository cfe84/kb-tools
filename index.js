const { parseCommandLine } = require("yaclip");
const notes = require("./src/notes");


const options = [
  { name: "notes", alias: "n", type: Boolean, multiple: false, subcommands: notes.options }
]

const command = parseCommandLine(options, { dashesAreOptional: true });

try {

  if (command.notes) {
    notes.command(command.notes);
  }
}
catch (error) {
  console.error(`Error: ${error.message}`)
}