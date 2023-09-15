#!/usr/bin/env node
// Copyright 2023 SIL International
import chalk from 'chalk';
import {program} from 'commander';
import {exiftool, Tags} from 'exiftool-vendored';
import * as fs from 'fs';
import {glob} from 'glob';
import * as meta from './meta.js';
import path from 'path';
import promptSync from 'prompt-sync';

//import {version} from '../package.json';

type fileType =
  "audio" | "image";

interface linkedFileType {
  fileName: string;
  fileType: fileType;
  tags: Tags;
}

////////////////////////////////////////////////////////////////////
// Get parameters
////////////////////////////////////////////////////////////////////
program
  //.version(version, '-v, --vers', 'output the current version')
  .description("Utilities to view/edit metadata info for images (jpg's or png's). If --tags not given, metadata is read")
    .option("-f, --file <path to single image file>", "path to an image file")
    .option("-t, --tags <JSON Object of metadata tags to write>", "If specified, metadata tags to write to file/project")
    .option("-p, --projectPath <path>", "path to project containing images")
  .parse(process.argv);

// Debugging parameters
const options = program.opts();
const debugMode = false;
if (debugMode) {
  console.log('Parameters:');
  if (options.file) {
    console.log(`Image file path: "${options.file}"`);
  }
  if (options.tags) {
    console.log(`Tag info: "${options.tags}"`);
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

// Check if image file or project directory exists
if (options.file && !fs.existsSync(options.file)) {
  console.error("Can't open image " + options.file);
  process.exit(1);
}
if (options.projectPath && !fs.existsSync(options.projectPath)) {
  console.error("Can't open project directory " + options.projectPath);
  process.exit(1);
}

// Validate one of the optional parameters is given
if (!options.file && !options.tags && !options.projectPath) {
  console.error("Need to pass another optional parameter [-f -t or -p]");
  process.exit(1);
}

////////////////////////////////////////////////////////////////////
// Routing commands to functions
////////////////////////////////////////////////////////////////////
let linkedFiles: linkedFileType[] = [];

if (options.file) {
  if (options.tags) {
    // Write tags
    if (debugMode) {
      console.log(`Writing tag info: ${options.tags}`);
    }
    await meta.writeImageTags(options.file, options.tags);
  }

  // Read tags
  const tags = await meta.readImageTags(options.file);
  linkedFiles.push({
    fileName: path.basename(options.file),
    fileType: "image",
    tags: tags
  });

} else if (options.projectPath) {
  console.log('searching for images in project')

  // Confirm if user wants to modify metadata for all the files in the project. Doesn't work in VS Code
  /*
  const prompt = promptSync();
  let confirmation = prompt("Are you sure you want to modify the metadata for all the images in the project? (y/n) ");
  confirmation = String(confirmation);
  if (confirmation.toLowerCase() === 'n') {
    process.exit(1);
  }
  */

  // Read/Write tags for all the images in a project (Do we limit to LinkedFiles/Pictures?)
  const images = glob.sync(options.projectPath + '**/*.{jpg,JPG,png,PNG}');
  for (const file of images) {
    if (options.tags) {
      // Write tags
      console.log(`Writing tag info: ${options.tags}`);
      await meta.writeImageTags(file, options.tags);
    }

    // Read tags
    const tags = await meta.readImageTags(file);
    linkedFiles.push({
      fileName: path.basename(file),
      fileType: "image",
      tags: tags
    });
  };
}

// Generate summary
console.log(chalk.blue('\n------------------------'));
console.log(chalk.blue('Licensing Info Summary:'));
linkedFiles.forEach(linkedFile => {
  const tagInfo = `${linkedFile.fileType} file ${linkedFile.fileName} has\n\tAuthor: ${linkedFile.tags.Author}` +
    `\n\tCopyright: ${linkedFile.tags.Copyright}\n\tFile Modify Date: ${linkedFile.tags.FileModifyDate}\n`;
  if (!linkedFile.tags.Copyright) {
    console.log(chalk.red(tagInfo));
  } else {
    console.log(chalk.green(tagInfo));
  }

})


console.log('All done processing');
////////////////////////////////////////////////////////////////////
// Processor functions
////////////////////////////////////////////////////////////////////

exiftool.end();
