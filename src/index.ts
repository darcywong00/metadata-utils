#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright 2023 SIL International
import chalk from 'chalk';
import { CommanderError, program } from 'commander';
import {exiftool, Tags} from 'exiftool-vendored';
import * as fs from 'fs';
import {glob} from 'glob';
import * as meta from './meta.js';
import path from 'path';
import promptSync from 'prompt-sync';

//import {version} from '../package.json';

////////////////////////////////////////////////////////////////////
// Get parameters
////////////////////////////////////////////////////////////////////
program
  //.version(version, '-v, --vers', 'output the current version')
  .description("Utilities to read/write metadata info for images (jpg's or png's). If --tags not given, metadata is read")
  .option("-f, --files <path to image files...>", "path to image files")
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

  // Check if image files or project directory exists
  if (options.files) {

    options.files.forEach(file => {
      if (!fs.existsSync(file)) {
        console.error(`${file} does not exist`);
        process.exit(1);
      }
    });
  }

  if (options.projectPath && !fs.existsSync(options.projectPath)) {
    console.error(`Can't open project directory ${options.projectPath}. Exiting`);
    process.exit(1);
  }
}

////////////////////////////////////////////////////////////////////
// Routing commands to functions
////////////////////////////////////////////////////////////////////
let linkedFiles: meta.linkedFileType[] = [];

if (options.files) {
  for (const file of options.files) {
    if (options.tags) {
      // Write tags
      if (debugMode) {
        console.log(`Writing tag info: ${options.tags}`);
      }
      await meta.writeImageTags(file, options.tags);
    }

    // Read tags
    const tags = await meta.readImageTags(file);
    linkedFiles.push({
      fileName: path.basename(tags.SourceFile),
      fileType: "image",

      sourceFile: tags.SourceFile,
      creator: tags.Creator,
      license: tags.License,
      rights: tags.Rights,

      tags: tags
    });
  }
} else {
  const projectPath = options.projectPath ? options.projectPath : process.cwd();
  console.log(`searching for images in project ${projectPath}`);

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
  const images = glob.sync(projectPath + '/**/*.{jpg,JPG,png,PNG}');
  for (const file of images) {
    if (options.tags) {
      // Write tags
      console.log(`Writing tag info: ${options.tags}`);
      await meta.writeImageTags(file, options.tags);
    }

    // Read tags
    const tags = await meta.readImageTags(file);
    linkedFiles.push({
      fileName: path.basename(tags.SourceFile),
      fileType: "image",

      sourceFile: tags.SourceFile,
      creator: tags.Creator,
      license: tags.License,
      rights: tags.Rights,

      tags: tags
    });
  };
}

// Generate summary
console.log(chalk.blue('\n------------------------'));
console.log(chalk.blue('Licensing Info Summary:'));
linkedFiles.forEach(linkedFile => {
  const tagInfo = `${linkedFile.fileType} file ${linkedFile.fileName} has\n\t` +
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
