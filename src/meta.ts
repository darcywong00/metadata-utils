import chalk from 'chalk';
import {exiftool, parseJSON, Tags} from 'exiftool-vendored';

export default {readTags, writeTags};

chalk.level = 1; // Use colors in the VS Code Debug Window

/**
 * Read metadata tags from an image file
 * @param file {string} - path to image file
 * @returns Promise<any> - tags in JSON format
 */
export async function readTags(file: string) : Promise<any> {
  const tags = await exiftool.readRaw(file);
  const str: string = JSON.stringify(tags);

  const tags2: Tags = parseJSON(str) as Tags;
  const tagInfo = `Image file ${tags2.FileName} has Artist: ${tags2.Artist}, Copyright: ${tags.Copyright}, File Modify Date: ${tags2.FileModifyDate}`;
  if (!tags2.Copyright) {
    console.log(chalk.red(tagInfo));
  } else {
    console.log(chalk.green(tagInfo));
  }
  return tags2;
}

export async function writeTags(file: string, tags: any) {
  const tags2 = parseJSON(tags) as Tags;
  // Update copyright info
  if (tags2.Artist) {
    await exiftool.write(file,
      {Artist: tags2.Artist});
  }

  if (tags2.Author) {
    await exiftool.write(file,
      {Author: tags2.Author});
  }

  if (tags2.Copyright) {
    // Note: exiftool can only modify exif:Copyright so
    // existing icc:copyright is left intact
    await exiftool.write(file,
      {Copyright: tags2.Copyright});
  }
  // Update dates UTC!


}
