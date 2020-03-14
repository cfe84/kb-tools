const fs = require("fs");
const path = require("path");
const help = require("./help")

const COMMAND_LIST_TODO = "todo";
const COMMAND_LINKS = "links";
const SUBCOMMAND_PATH = "path"

const subcommands = [
  { name: SUBCOMMAND_PATH, alias: "p", type: String }
]

const checkOptions = [
  { name: COMMAND_LIST_TODO, alias: "t", type: Boolean, subcommands, description: "Search for todos (in format \\{t*\\})" },
  { name: COMMAND_LINKS, alias: "l", type: Boolean, subcommands, description: "Check links" },
]
const checkCommand = { name: "check", alias: "c", type: Boolean, multiple: false, subcommands: checkOptions };

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

function getAllFiles(options) {
  const path = options[SUBCOMMAND_PATH] ? options[SUBCOMMAND_PATH].value : ".";
  const files = mapDir(path, "/", (file, relativePath, filePath) => {
    return {
      file,
      relativePath,
      filePath
    };
  });
  return files;
}

function filterMd(files) {
  const linksRegex = RegExp("\\[([^\\]]*)\\]\\(([^)]*)\\)", "g");
  return files.filter((file) => file.file.endsWith(".md"))
    .map((file) => {
      const content = fs.readFileSync(file.filePath).toString();
      const links = [...content.matchAll(linksRegex)].map(entry => ({
        name: entry[1],
        link: entry[2]
      }))
        .filter(link => !link.link.startsWith("http") &&
          !link.link.startsWith("/tags/"))
      file.links = links;
      return file;
    })
}

const displayProblem = (message, file, link = undefined) => {
  console.log(`${message}. File: ${file.filePath}${link ? ` | Link name: ${link.name} | Link: ${link.link}` : ""}`)
}


function resolveLink(files, file, link) {
  let linkFilePath = getLinkPath(link, file);
  let find = files.find(file => file.relativePath === linkFilePath);
  return find
}

function getLinkPath(link, file) {
  const linkPathRegex = new RegExp("(\\w+)(?:#([\\w\\d]*))$");
  let linkFilePath = link.link.replace(linkPathRegex, "$1");
  if (!linkFilePath.startsWith("/")) {
    if (linkFilePath.startsWith("./")) {
      linkFilePath = linkFilePath.substring(2, linkFilePath.length);
    }
    const filePathIndex = file.relativePath.lastIndexOf("/") + 1;
    const filePath = file.relativePath.substring(0, filePathIndex);
    linkFilePath = filePath + linkFilePath;
  }
  return linkFilePath;
}


const checkLinks = (options) => {
  const files = getAllFiles(options);
  const mdFiles = filterMd(files)
  const mdFilesWithLinks = mdFiles
    .filter(file => file.links.length > 0);

  mdFiles
    .filter(file => file.links.length === 0)
    .filter(file => !mdFilesWithLinks.find(mdFile => !!mdFile.links.find(link => getLinkPath(link, mdFile) === file.relativePath)))
    .forEach(file => displayProblem(`WARNING: card is orphaned (has no link and is not linked)`, file))

  mdFilesWithLinks.map(mdFile => {
    mdFile.links
      .map(link => {
        if (link.link.indexOf("..") >= 0) {
          displayProblem(`WARNING: link contains ".." - avoid backwards relative path linking`, mdFile, link)
        }

        const correspondingFileIndex = resolveLink(files, mdFile, link);
        if (!correspondingFileIndex) {
          displayProblem(`ERROR: card not found`, mdFile, link)
        }
      })
  })
}

const check = (command) => {
  if (command[COMMAND_LIST_TODO]) {
    listTodo(command[COMMAND_LIST_TODO])
  } else if (command[COMMAND_LINKS]) {
    checkLinks(command[COMMAND_LINKS])
  } else {
    help.displayHelp("Check your kb", checkOptions)
  }
}

module.exports = {
  exec: check,
  command: checkCommand
}
