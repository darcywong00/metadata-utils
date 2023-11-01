import chalk from 'chalk';
import { exiftool, parseJSON, Tags, WriteTags } from 'exiftool-vendored';
import path from 'path';

// Utilities to read and write metadata tags from an image file.
// Currently, we are interested in {creator, license, rights}

export default {getTags, writeImageTags};

export type fileType =
  "audio" | "image";

// Default creative commons license
export const DEFAULT_LICENSE_CC_BY_NC_SA = "https://creativecommons.org/licenses/by-nc-sa/4.0/";

export interface linkedFileType {
  fileName: string;
  fileType: fileType;

  // primary fields of the tags we care about
  sourceFile: string | undefined;
  creator: string | undefined;
  license: string | undefined;
  rights: string | undefined;

  // All the tags
  tags?: Tags;
}

// The fields of the XMP metadata tag we care about
export interface xmpTagType {
  'XMP:Creator'? : string;
  'XMP:License'? : string;
  'XMP:Rights'? : string;
}

chalk.level = 1; // Use colors in the VS Code Debug Window

/**
 * Retrieve the metadata tags from a list of files
 * @param files {string[]} - Path to image files
 * @returns - Array of linkedFileType
 */
export async function getTags(files: string[]) : Promise<linkedFileType[]> {
  const promises : Array<Promise<any>> = [];
  files.forEach((file) => {
    promises.push(exiftool.readRaw(file, ['all', '-xmp:all']));
  });

  let linkedFiles: linkedFileType[] = [];
  const allTags = await Promise.all(promises);
  allTags.forEach(rawTags => {
    const str: string = JSON.stringify(rawTags);
    const tags: any = parseJSON(str) as any;
    linkedFiles.push({
      fileName: path.basename(tags.SourceFile),
      fileType: "image",

      sourceFile: tags.SourceFile,
      creator: tags.Creator,
      license: tags.License,
      rights: tags.Rights,

      // Uncomment if we want more metadata tags
      //tags: tags
    });
  });

  return linkedFiles;
}



/**
 * Get the current metadata tags from a list of image files. Then update
 * the tags we care about
 * @param files {string[]} - path to image files
 * @param newTags {Object} - JSON Object of metadata tags
 */
export async function writeImageTags(files: string[], newTags: any) {
  const fileTags = await getTags(files);
  const promises : Array<Promise<any>> = [];

  fileTags.forEach((currentTags, index) => {
    const tagToWrite : xmpTagType = {};
    // Update creator info
    if (newTags.hasOwnProperty('creator')) {
      if (currentTags.creator != newTags.creator) {
        const warning = `WARNING: Overwriting ${path.basename(currentTags.fileName)} ` +
          `existing creator: ${currentTags.creator} with ${newTags.creator}`;
        console.log(chalk.red(warning));
      }

      tagToWrite['XMP:Creator'] = newTags.creator;
    }

    // Update License info
    if (newTags.hasOwnProperty('license')) {
      if (currentTags.license != newTags.license) {
        const warning = `WARNING: Overwriting ${path.basename(currentTags.fileName)} ` +
          `existing license: ${currentTags.license} with ${newTags.license}`;
        console.log(chalk.red(warning));
      }

      tagToWrite['XMP:License'] = newTags.license;
    }

    // Update Rights info
    if (newTags.hasOwnProperty('rights')) {
      if (currentTags.rights != newTags.rights) {
        const warning = `WARNING: Overwriting ${path.basename(currentTags.fileName)} ` +
          `existing rights: ${currentTags.rights} with ${newTags.rights}`;
        console.log(chalk.red(warning));
      }

      tagToWrite['XMP:Rights'] = newTags.rights;
    }

    // If tagToWrite has content, add it to the promises to write
    if (Object.keys(tagToWrite).length != 0) {
      promises.push(
        exiftool.write(files[index],
          tagToWrite as WriteTags,
          ['-overwrite_original']));
    }
  });

  await Promise.all(promises)
   .catch((error) => {
    console.error(error.message);
   });
}
