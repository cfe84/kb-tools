const fs = require("fs");
const path = require("path");

const COMMAND_LIST_TODO = "todo";
const COMMAND_LINKS = "links";
const SUBCOMMAND_PATH = "path"

const subcommands = [
  { name: SUBCOMMAND_PATH, alias: "p", type: String }
]

const checkOptions = [
  { name: COMMAND_LIST_TODO, alias: "t", type: Boolean, subcommands },
  { name: COMMAND_LINKS, alias: "l", type: Boolean, subcommands },
]

const todoRegex = RegExp("{t(?:odo)?(?::|\s)*([^}]+)}", "gi");


const mapDir = (dir, relativePath, fileCallback) => {
  const files = fs.readdirSync(dir);
  return files.map((file) => {
    if (file.startsWith(".")) {
      return []
    } else {
      const newRelativePath = path.join(relativePath, file)
      const filePath = path.join(dir, file)
      if (fs.statSync(filePath).isDirectory()) {
        return mapDir(filePath, newRelativePath, fileCallback)
      } else {
        return fileCallback(file, newRelativePath, filePath);
      }
    }
  }).reduce((array, current) => array.concat(current), [])
}

const findTodoInFile = (file) => {
  const content = fs.readFileSync(file).toString();
  const regexResult = content.match(todoRegex);
  if (regexResult) {
    return regexResult.map(text => ({ file, text: text.replace(todoRegex, "$1") }));
  } else {
    return []
  }
}

const listTodo = (options) => {
  const path = options[SUBCOMMAND_PATH] ? options[SUBCOMMAND_PATH].value : "."
  const todos = mapDir(path, ".", (file, dir, filePath) => {
    if (file.endsWith(".md")) {
      return findTodoInFile(filePath)
    } else {
      return []
    }
  });
  console.log(todos.map((todo) => `${todo.text}: ${todo.file}`).join("\n"));
}

const checkLinks = (options) => {
  const path = options[SUBCOMMAND_PATH] ? options[SUBCOMMAND_PATH].value : "."
  const linksRegex = RegExp('\\[([^\\]]*)\\]\\(([^)]*)\\)', "g");
  const files = mapDir(path, ".", (file, dir, filePath) => {
    const content = fs.readFileSync(filePath).toString();
    const links = content.match(linksRegex);
    return {
      file,
      dir,
      links,
      filePath
    }
  });
  console.log(files);
}

const check = (command) => {
  if (command[COMMAND_LIST_TODO]) {
    listTodo(command[COMMAND_LIST_TODO])
  } else if (command[COMMAND_LINKS]) {
    checkLinks(command[COMMAND_LINKS])
  } else {
    throw Error("Unknown todo command")
  }
}

module.exports = {
  command: check,
  options: checkOptions
}