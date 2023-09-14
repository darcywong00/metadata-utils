import chalk from 'chalk';
import {exiftool, parseJSON, Tags} from 'exiftool-vendored';
import path from 'path';

export default {readTags, writeTags};

chalk.level = 1; // Use colors in the VS Code Debug Window

// Utilities to read and write metadata tags from an image file.
// Currently, we are interested in Author, Copyright

/**
 * Read all the metadata tags from an image file
 * @param file {string} - path to image file
 * @returns Promise<Tags> - tags in JSON format
 */
export async function readTags(file: string) : Promise<Tags> {
  const tags = await exiftool.readRaw(file);
  const str: string = JSON.stringify(tags);
  const tags2: Tags = parseJSON(str) as Tags;

  const tagInfo = `Image file ${tags2.FileName} has Author: ${tags2.Author}, Copyright: ${tags.Copyright}, File Modify Date: ${tags2.FileModifyDate}`;
  if (!tags2.Copyright) {
    console.log(chalk.red(tagInfo));
  } else {
    console.log(chalk.green(tagInfo));
  }
  return tags2;
}

/**
 * Get the current metadata tags from an image file. Then update
 * the tags we care about
 * @param file {string} - path to image file
 * @param tags {string} - metadata to write as a JSON string
 */
export async function writeTags(file: string, tags: any) {
  const currentTags = await exiftool.readRaw(file);

  const tags2 = parseJSON(tags) as Tags;
  // Update copyright info
  if (tags2.Author) {
    try {
      await exiftool.write(file,
        {Author: tags2.Author});
    } catch (err: any) {
      console.error("ERROR:", err.message);
    }
  }

  if (tags2.hasOwnProperty('Copyright')) {
    if (currentTags.Copyright) {
      const warning = `WARNING: Overwriting ${path.basename(file)} existing copyright: ${currentTags.Copyright}`;
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
  // Update dates UTC!


}
