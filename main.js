const Pastebin = require("./Pastebin.js");
const Filter = require("./filter.js.example")
const fs = require("fs");

const OUTPUT_DIR = "out/";

function write_to_file(file_name, contents) {
  const file_path = OUTPUT_DIR+file_name;

  fs.writeFile(file_path, contents, function(err) {
    if (err) {
      return console.error("Failed to write to", file_path, err);
    }
  });
}

Pastebin.on("new_paste", function(id, paste) {
  for(let regex of Filter.regex) {
    if (paste.match(regex.regex)) {
      console.log("Logging", id, "because it matches regex", regex.description);
      write_to_file("{0}-{1}.txt".format(id, regex.description), paste);
      return;
    }
  }

  for(let test of Filter.tests) {
    if (test.test(paste)) {
      console.log("Logging", id, "because it passed test", test.description);
      write_to_file("{0}-{1}.txt".format(id, test.description), paste);
      return;
    }
  }
})
