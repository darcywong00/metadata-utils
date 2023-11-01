#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright 2023 SIL International
import chalk from 'chalk';
import {CommanderError, program} from 'commander';
import {exiftool, parseJSON} from 'exiftool-vendored';
import * as fs from 'fs';
import {glob} from 'glob';
import * as meta from './meta.js';
import require from './cjs-require.js';
import promptSync from 'prompt-sync';

//import {version} from '../package.json';

////////////////////////////////////////////////////////////////////
// Get parameters
////////////////////////////////////////////////////////////////////
program
  //.version(version, '-v, --vers', 'output the current version')
  .description("Utilities to read/write metadata info for images (jpg's or png's). If --tags not given, metadata is read")
  .option("-f, --files <path to image files...>", "path to image files")
  .option("-j, --json <path to JSON Object of metadata tags to write>", "If specified, metadata tags to write to file(s)/project")
  .option("-t, --tags <JSON Object of metadata tags to write>", "If specified, metadata tags to write to file/project")
  .option("-p, --projectPath <path>", "path to project containing metadata files. If not specified, the project path is assumed to be current directory")
  .exitOverride();
try {
  program.parse();
} catch(error: unknown) {
  if (error instanceof CommanderError) {
    console.error(error.message);
  }
  process.exit(1);
}

const debugMode = true;

// Validate parameters
const options = program.opts();
validateParameters(options);

////////////////////////////////////////////////////////////////////
// End of processor functions
////////////////////////////////////////////////////////////////////

function validateParameters(options) {
  if (debugMode) {
    console.log('Parameters:');
    if (options.files) {
      console.log(`Image file path: "${options.files}"`);
    }
    if (options.json) {
      console.log(`Tag info: "${options.json}"`);
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

  // Check if image files or project directory exists
  if (options.files) {

    options.files.forEach(file => {
      if (!fs.existsSync(file)) {
        console.error(`${file} does not exist. Exiting`);
        process.exit(1);
      }
    });
  }

  if (options.projectPath && !fs.existsSync(options.projectPath)) {
    console.error(`Can't open project directory ${options.projectPath}. Exiting`);
    process.exit(1);
  }

  // Check if JSON file exists
  if (options.json && !fs.existsSync(options.json)) {
    console.error(`Can't open JSON file ${options.json}. Exiting`);
    process.exit(1);
  }

  // Require files or projectPath parameter
  if (!options.files && !options.projectPath) {
    console.error(`--files or --projectPath parameter required. Exiting`);
    process.exit(1);
  }

  // Conflict if both tags and json parameter provided
  if (options.tags && options.json) {
    console.error(`Cannot provide --tags and --json parameter. Exiting`);
    process.exit(1);
  }
}

////////////////////////////////////////////////////////////////////
// Routing commands to functions
////////////////////////////////////////////////////////////////////
let linkedFiles: meta.linkedFileType[] = [];

// Determine files to process
let files;
if (options.files) {
  files = options.files;
  console.log(`Processing files: ${files}`);
} else {
  // Read/Write tags for all the images in a project (Do we limit to LinkedFiles/Pictures?)
  const projectPath = options.projectPath ? options.projectPath : process.cwd();
  files = glob.sync(projectPath + '/**/*.{jpg,JPG,png,PNG}');
  console.log(`Processing files in project ${projectPath}`);
}

let newTags;
if (options.tags || options.json) {
  newTags = (options.tags) ? parseJSON(options.tags) as any : require(options.json);
}

// Overwrite metadata tags
if (newTags) {

  // Confirm if user wants to modify metadata for all the files in the project.
  console.log(`New tags to write are: ` +
    JSON.stringify(newTags, (k, v) => v === undefined ? null : v, 2));
  const prompt = promptSync();
  let confirmation = prompt("Are you sure you want to modify the metadata for all the images in the project? (y/n) ");
  confirmation = String(confirmation);
  if (confirmation.toLowerCase() === 'n') {
    process.exit(1);
  }

  await meta.writeImageTags(files, newTags);
}

// Read tags
linkedFiles = await meta.getTags(files);

// Generate summary
console.log(chalk.blue('\n------------------------'));
console.log(chalk.blue('Licensing Info Summary:'));
linkedFiles.forEach(linkedFile => {
  const tagInfo = `${linkedFile.fileType} file ${linkedFile.fileName} has\n\t` +
    `Source File: ${linkedFile.sourceFile}\n\t` +
    `File Type: ${linkedFile.fileType}\n\t` +
    `Creator: ${linkedFile.creator}\n\t` +
    `License: ${linkedFile.license}\n\t` +
    `Rights: ${linkedFile.rights}\n`;
  if (!linkedFile.license) {
    console.log(chalk.red(tagInfo));
  } else {
    console.log(chalk.green(tagInfo));
  }

})

// Write summary to file. Preserve undefined properties as null, and pretty-print with 2 spaces
const filename = 'log.json';
fs.writeFileSync('./' + filename,
  JSON.stringify(linkedFiles, (k, v) => v === undefined ? null : v, 2));
console.log(`metadata log written to ${filename}`);

console.log('All done processing');
////////////////////////////////////////////////////////////////////
// Processor functions
////////////////////////////////////////////////////////////////////

exiftool.end();
