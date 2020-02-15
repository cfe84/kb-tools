const fs = require("fs");
const path = require("path");
const mdTemplate = fs.readFileSync(path.join(__dirname, "export-highlights-md.handlebars")).toString();
const htmlTemplate = fs.readFileSync(path.join(__dirname, "export-highlights-html.handlebars")).toString();
const handlebars = require("handlebars");

const fileInputOutputOptions = [
  { name: "input", alias: "i", type: String, optional: false },
  { name: "output", alias: "o", type: String, optional: false },
  { name: "format", alias: "f", type: String }
]

const notesOptions = [
  { name: "convert", alias: "c", type: Boolean, subcommands: fileInputOutputOptions },
  { name: "extract", alias: "e", type: Boolean, subcommands: fileInputOutputOptions }
]

const loadNotes = (command) => {
  if (!command.input || !command.output) {
    throw Error("Missing input or output")
  }
  return JSON.parse(fs.readFileSync(command.input.value));
}

const notesConvert = (command) => {
  const notes = loadNotes(command);
  const title = notes.title;
  const author = notes.authors;
  const template = command.format && command.format.value === "html" ?
    htmlTemplate
    : mdTemplate;
  const formatter = handlebars.compile(template);
  formattedHighlights = formatter({
    highlights: notes.highlights,
    title,
    author
  })
  fs.writeFileSync(command.output.value, formattedHighlights)
}

const notesExtractNotes = (command) => {

}

const notes = (commands) => {
  if (commands.convert) {
    notesConvert(commands.convert);
  } else if (commands.extract) {
    notesExtractNotes(commands.extract)
  }
}

module.exports = {
  command: notes,
  options: notesOptions
}