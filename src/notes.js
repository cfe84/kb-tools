const fs = require("fs");
const path = require("path");
const parse5 = require("parse5");
const mdHighlightsTemplate = fs.readFileSync(path.join(__dirname, "export-highlights-md.handlebars")).toString();
const mdNotesTemplate = fs.readFileSync(path.join(__dirname, "export-notes-md.handlebars")).toString();
const htmlHighlightsTemplate = fs.readFileSync(path.join(__dirname, "export-highlights-html.handlebars")).toString();
const handlebars = require("handlebars");

const COMMAND_EXTRACT_HIGHLIGHTS = "extract-highlights";
const COMMAND_EXTRACT_NOTES = "extract-notes";

const OPTIONS_INPUT = "input";
const OPTIONS_OUTPUT = "output";
const OPTIONS_INPUT_FORMAT = "input-format";
const OPTIONS_OUTPUT_FORMAT = "output-format";

const FORMAT_MD = "markdown";
const FORMAT_HTML = "html";
const FORMAT_JSON = "json";
const FORMAT_CLIPPINGS = "clippings";

const fileInputOutputOptions = [
  { name: OPTIONS_INPUT, alias: "i", type: String, optional: false },
  { name: OPTIONS_OUTPUT, alias: "o", type: String, optional: false },
  { name: OPTIONS_OUTPUT_FORMAT, alias: "O", type: String },
  { name: OPTIONS_INPUT_FORMAT, alias: "I", type: String }
]

const notesOptions = [
  { name: COMMAND_EXTRACT_HIGHLIGHTS, alias: "h", type: Boolean, subcommands: fileInputOutputOptions },
  { name: COMMAND_EXTRACT_NOTES, alias: "n", type: Boolean, subcommands: fileInputOutputOptions },
]

const loadJSONNotes = (file) => {
  return JSON.parse(fs.readFileSync(file));
}

const translateNoteType = (type) => {
  switch (type) {
    case "surlignement": return "Highlight";
    case "signet": return "bookmark";
    default: return type;
  }
}

const loadKindleClippings = (file) => {
  const titleLineRegex = RegExp("^(.+)\\(([^)]+)\\)$", "gm");
  const locationRegex = RegExp("((?:page \\d+ \\| )?(?:\\w+ \\d+(?:-\\d+)?)) \\| ", "gm");
  const noteTypeRegex = RegExp("^- \\w+ (\\w+)", "mi")
  const cleanupRegex = RegExp("\r", "g")
  const parseClippingsNote = ((note) => {
    const lines = note.replace(cleanupRegex, "").trim().split("\n");
    titleLineRegex.exec(lines[0])
    const titleRegexResult = titleLineRegex.exec(lines[0]);
    const locationRegexResult = locationRegex.exec(lines[1]);
    const noteTypeRegexResult = noteTypeRegex.exec(lines[1]);
    if (!titleRegexResult || !locationRegexResult || !noteTypeRegexResult) {
      throw Error(`Clippings file is incorrectly formatted. 
        Title: ${JSON.stringify(titleRegexResult)}, 
        Location: ${JSON.stringify(locationRegexResult)}, 
        Type: ${JSON.stringify(noteTypeRegexResult)}. 
        Record is incorrect: ${JSON.stringify(lines)}`);
    }
    const title = titleRegexResult[1];
    const author = titleRegexResult[2];
    const location = locationRegexResult[1];
    const noteType = translateNoteType(noteTypeRegexResult[1]);
    lines.splice(0, 3);
    const content = lines.join("\n");
    return {
      title,
      author,
      text: noteType === "Highlight" ? content : "",
      location,
      note: noteType === "note" ? content : ""
    };
  })
  const content = fs.readFileSync(file).toString();
  const notes = content
    .split("==========")
    .map(parseClippingsNote)
  return notes;
}

const loadKindleHtmlExport = (file) => {
  const findChildByTag = (node, tagname) => node.childNodes.find((n) => n.tagName === tagname);
  const findTextNode = (node) => {
    const text = node.childNodes.find((n) => n.nodeName === "#text");
    if (text) {
      return text.value
    } else {
      return null
    }
  }
  const findChildByAttribute = (node, attrName, attrValue) =>
    node.childNodes.find((n) => {
      if (!n.attrs) {
        return false;
      }
      const attr = n.attrs.find((attr) => attr.name === attrName);
      return attr && attr.value === attrValue
    });

  const content = fs.readFileSync(file).toString();
  const document = parse5.parse(content);
  const html = findChildByTag(document, "html");
  const body = findChildByTag(html, "body");
  const container = findChildByAttribute(body, "class", "bodyContainer");
  const titleNode = findChildByAttribute(container, "class", "bookTitle");
  const authorNode = findChildByAttribute(container, "class", "authors");

  if (!titleNode || !authorNode) {
    throw Error(`File is malformed: title: ${titleNode}, author: ${authorNode}`)
  }
  const title = findTextNode(titleNode).trim();
  const authors = findTextNode(authorNode).trim();

  let type = null;
  let location = 0;
  let notes = [];
  container.childNodes.forEach((node) => {
    if (!node.attrs) {
      return;
    }
    const nodeTypeAttr = node.attrs.find((attr) => attr.name === "class");
    if (!nodeTypeAttr) {
      return;
    }
    const nodeType = nodeTypeAttr.value
    if (nodeType === "noteHeading") {
      const nodeText = node.childNodes
        .filter((sub) => sub.nodeName === "#text")
        .map((sub) => sub.value)
        .join(" ")
      const noteHeadingRegex = RegExp("(\\w+) .*Location (\\d+)", "mi")
      const noteHeadingRegexResult = noteHeadingRegex.exec(nodeText);
      if (!noteHeadingRegexResult) {
        console.log(node)
        throw Error(`Node is malformed: ${noteHeadingRegexResult} (text: ${nodeText})`);
      }
      type = noteHeadingRegexResult[1];
      location = noteHeadingRegexResult[2];
    }
    if (nodeType === "noteText") {
      const nodeText = findTextNode(node).trim();
      notes.push({
        location: { value: location },
        text: type === "Highlight" ? nodeText : null,
        note: type !== "Highlight" ? nodeText : null
      })
    }
  })

  return {
    title,
    authors,
    highlights: notes
  }
}

const loadNotes = (command) => {
  if (!command[OPTIONS_INPUT]) {
    throw Error("Missing input")
  }
  const file = command[OPTIONS_INPUT].value;
  const format = command[OPTIONS_INPUT_FORMAT] ? commands[OPTIONS_INPUT_FORMAT].value : null;
  if (format === FORMAT_JSON || (!format && file.endsWith(".json")))
    return loadJSONNotes(file)
  else if (format === FORMAT_CLIPPINGS || (!format && file.endsWith(".txt")))
    return loadKindleClippings(file);
  else if (format === FORMAT_HTML || (!format && file.endsWith(".html")))
    return loadKindleHtmlExport(file)
  else
    throw (Error("Unknown input file format"))
}

const convertNotes = (command, options) => {
  const notes = loadNotes(options);
  const title = notes.title;
  const author = notes.authors;
  const template =
    command === COMMAND_EXTRACT_HIGHLIGHTS
      ? options[OPTIONS_OUTPUT_FORMAT] && options[OPTIONS_OUTPUT_FORMAT].value === FORMAT_HTML
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

  if (commands[COMMAND_EXTRACT_HIGHLIGHTS]) {
    convertNotes(COMMAND_EXTRACT_HIGHLIGHTS, commands[COMMAND_EXTRACT_HIGHLIGHTS]);
  } else if (commands[COMMAND_EXTRACT_NOTES]) {
    convertNotes(COMMAND_EXTRACT_NOTES, commands[COMMAND_EXTRACT_NOTES])
  }
}

module.exports = {
  command: notes,
  options: notesOptions
}