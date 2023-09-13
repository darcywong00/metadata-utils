#!/usr/bin/env node
// Copyright 2023 SIL International
const exiftool = require('exiftool-vendored').exiftool;
const {program} = require('commander');
import * as fs from 'fs';
import {globby} from 'globby';
const {version} = require('../package.json');

////////////////////////////////////////////////////////////////////
// Get parameters
////////////////////////////////////////////////////////////////////
program
  .version(version, '-v, --vers', 'output the current version')
  .description("Utilities to edit licensing/copyright info for images. ")
    .option("-f, --file <path to single image file>", "path to an image file")
    .option("-c, --copyright <copyright info>", "String to put in copyright field")
    .option("-p, --projectPath <path>", "path to project containing images")
  .parse(process.argv);

// Debugging parameters
const options = program.opts();
const debugMode = true;
if (debugMode) {
  console.log('Parameters:');
  if (options.file) {
    console.log(`Image file path: "${options.file}"`);
  }
  if (options.copyright) {
    console.log(`Copyright info: "${options.copyright}"`);
  }
  if (options.projectPath) {
    console.log(`Project path: "${options.projectPath}`);
  }

  // Verify exiftool is working:
  exiftool
    .version()
    .then((exifVersion) => console.log(`We're running ExifTool v${exifVersion}`));
  console.log('\n');
}

// Project Name required
/*if (!options.projectName) {
  console.error("Project name required");
  process.exit(1);
}
*/

// Check if txt/JSON file or directory exists
if (options.file && !fs.existsSync(options.file)) {
  console.error("Can't open image " + options.file);
  process.exit(1);
}
if (options.projectPath && !fs.existsSync(options.projectPath)) {
  console.error("Can't open project directory " + options.projectPath);
  process.exit(1);
}

// Validate one of the optional parameters is given
if (!options.file && !options.copyright && !options.projectPath) {
  console.error("Need to pass another optional parameter [-f -c or -p]");
  process.exit(1);
}

////////////////////////////////////////////////////////////////////
// Routing commands to functions
////////////////////////////////////////////////////////////////////

if (options.file) {
  // Read tags
  exiftool
    .read(options.file)
    .then((tags) =>
      console.log(
        `Image ${tags.FileName} has Artist: ${tags.Artist}, Copyright: ${tags.Copyright}, File Modify Date: ${tags.FileModifyDate}, Errors: ${tags.errors}`
      )
    )
    .catch((err) => console.error("Something terrible happened: ", err));
  
} else if (options.copyright) {
  // Modify image metadata
  
  
} else if (options.projectPath) {
  // Do something with all the images in a project
  (async () => {
    const paths = await globby(options.projectPath, {
      expandDirectories: {
        extensions: ['jpg', 'JPG', 'png', 'PNG']
      }
    });
    paths.forEach(file => {
      // Read tags
      exiftool
        .read(file)
        .then((tags) =>
          console.log(
            `Image ${tags.FileName} has Artist: ${tags.Artist}, Copyright: ${tags.Copyright}, File Modify Date: ${tags.FileModifyDate}, Errors: ${tags.errors}`
          )
        )
        .catch((err) => console.error("Something terrible happened: ", err));
    });
  });
}

console.log('All done processing');
////////////////////////////////////////////////////////////////////
// Processor functions
////////////////////////////////////////////////////////////////////

//process.exit(1);
