const { parseCommandLine } = require("yaclip");
const notes = require("./src/notes");
const todo = require("./src/todo");

const options = [
  { name: "notes", alias: "n", type: Boolean, multiple: false, subcommands: notes.options },
  { name: "todo", alias: "t", type: Boolean, multiple: false, subcommands: todo.options },
]

const command = parseCommandLine(options, { dashesAreOptional: true });

try {
  if (command.notes) {
    notes.command(command.notes);
  } else if (command.todo) {
    todo.command(command.todo);
  }
}
catch (error) {
  console.error(`Error: ${error.message}`)
}