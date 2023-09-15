import chalk from 'chalk';
import {exiftool, parseJSON, Tags} from 'exiftool-vendored';
import path from 'path';

export default {readImageTags, writeImageTags};

export type fileType =
  "audio" | "image";

export interface linkedFileType {
  fileName: string;
  fileType: fileType;
  tags: Tags;
}

chalk.level = 1; // Use colors in the VS Code Debug Window

// Utilities to read and write metadata tags from an image file.
// Currently, we are interested in Author, Copyright

/**
 * Read all the metadata tags from an image file
 * @param file {string} - path to image file
 * @returns Promise<Tags> - tags in JSON format
 */
export async function readImageTags(file: string) : Promise<Tags> {
  const tags = await exiftool.readRaw(file);
  const str: string = JSON.stringify(tags);
  const tags2: Tags = parseJSON(str) as Tags;
  return tags2;
}

/**
 * Get the current metadata tags from an image file. Then update
 * the tags we care about
 * @param file {string} - path to image file
 * @param tags {string} - metadata to write as a JSON string
 */
export async function writeImageTags(file: string, tags: any) {
  const currentTags = await readImageTags(file);

  const tags2 = parseJSON(tags) as Tags;
  // Update Author info
  if (tags2.hasOwnProperty('Author')) {
    if (tags2.Author) {
      if (currentTags.Author != tags2.Author) {
        const warning = `WARNING: Overwriting ${path.basename(file)} existing author: ${currentTags.Author} with ${tags2.Author}`;
        console.log(chalk.red(warning));
      }

      try {
        await exiftool.write(file,
          {Author: tags2.Author});
      } catch (err: any) {
        console.error("ERROR:", err.message);
      }
    }
  }

  // Update Copyright info
  if (tags2.hasOwnProperty('Copyright')) {
    if (currentTags.Copyright != tags2.Copyright) {
      const warning = `WARNING: Overwriting ${path.basename(file)} existing copyright: ${currentTags.Copyright} with ${tags2.Copyright}`;
      console.log(chalk.red(warning));
    }

    // Note: exiftool can only modify exif:Copyright so
    // existing camera metadata icc:copyright is left intact
    try {
      await exiftool.write(file,
        {Copyright: tags2.Copyright});
    } catch (err: any) {
      console.error("ERROR:", err.message);
    }
  }

  // Update modify dates UTC?
}
