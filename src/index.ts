#!/usr/bin/env node
// Copyright 2023 SIL International
import {program} from 'commander';
import {exiftool, parseJSON} from 'exiftool-vendored';
import * as fs from 'fs';
import {glob} from 'glob';
import * as meta from './meta.js';
//import {version} from '../package.json';

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

if (options.file) {
  if (options.tags) {
    // Write tags
    console.log(`Writing tag info: ${options.tags}`);
    await meta.writeTags(options.file, options.tags);
  }

  // Read tags
  const tags = await meta.readTags(options.file);

} else if (options.projectPath) {
  console.log('searching for images in project')

  // Read/Write tags for all the images in a project (Do we limit to LinkedFiles/Pictures?)
  const images = glob.sync(options.projectPath + '**/*.{jpg,JPG,png,PNG}');
  for (const file of images) {
    if (options.tags) {
      // Write tags
      console.log(`Writing tag info: ${options.tags}`);
      await meta.writeTags(file, options.tags);
    }

    // Read tags
    const tags = await meta.readTags(file);
  };
}

console.log('All done processing');
////////////////////////////////////////////////////////////////////
// Processor functions
////////////////////////////////////////////////////////////////////

exiftool.end();
