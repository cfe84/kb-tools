const fs = require("fs");
const path = require("path");
const mdHighlightsTemplate = fs.readFileSync(path.join(__dirname, "export-highlights-md.handlebars")).toString();
const mdNotesTemplate = fs.readFileSync(path.join(__dirname, "export-notes-md.handlebars")).toString();
const htmlHighlightsTemplate = fs.readFileSync(path.join(__dirname, "export-highlights-html.handlebars")).toString();
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

const convertNotes = (command, options) => {
  const notes = loadNotes(options);
  const title = notes.title;
  const author = notes.authors;
  const template =
    command.convert
      ? options.format && options.format.value === "html"
        ? htmlHighlightsTemplate
        : mdHighlightsTemplate
      : mdNotesTemplate;
  const formatter = handlebars.compile(template);
  formattedHighlights = formatter({
    highlights: notes.highlights,
    title,
    author
  })
  fs.writeFileSync(options.output.value, formattedHighlights)
}

const notes = (commands) => {

  if (commands.convert) {
    convertNotes(commands, commands.convert);
  } else if (commands.extract) {
    convertNotes(commands, commands.extract)
  }
}

module.exports = {
  command: notes,
  options: notesOptions
}