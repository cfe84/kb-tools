const fs = require("fs");
const path = require("path");

const COMMAND_LIST_TODO = "todo";
const SUBCOMMAND_PATH = "path"

const subcommands = [
  { name: SUBCOMMAND_PATH, alias: "p", type: String }
]

const checkOptions = [
  { name: COMMAND_LIST_TODO, alias: "t", type: Boolean, subcommands },
]

const todoRegex = RegExp("{t(?:odo)?(?::|\s)*([^}]+)}", "gi");

const findTodoInFile = (file) => {
  const content = fs.readFileSync(file).toString();
  const regexResult = content.match(todoRegex);
  if (regexResult) {

    return regexResult.map(text => ({ file, text: text.replace(todoRegex, "$1") }));
  } else {
    return []
  }
}

const findTodoInPath = (p) => {
  const files = fs.readdirSync(p);
  return files.map((file) => {
    const filePath = path.join(p, file)
    if (fs.statSync(filePath).isDirectory()) {
      return findTodoInPath(filePath)
    } else if (file.endsWith(".md")) {
      return findTodoInFile(filePath)
    } else {
      return []
    }
  }).reduce((array, current) => array.concat(current), [])
}

const listTodo = (options) => {
  const path = options[SUBCOMMAND_PATH] ? options[SUBCOMMAND_PATH].value : "."
  const todos = findTodoInPath(path);
  console.log(todos.map((todo) => `${todo.text}: ${todo.file}`).join("\n"));
}

const check = (command) => {
  if (command[COMMAND_LIST_TODO]) {
    listTodo(command[COMMAND_LIST_TODO])
  } else {
    throw Error("Unknown todo command")
  }
}

module.exports = {
  command: check,
  options: checkOptions
}