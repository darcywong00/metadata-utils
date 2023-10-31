import chalk from 'chalk';
import { ExifDateTime, exiftool, parseJSON, Tags} from 'exiftool-vendored';
import path from 'path';

export default {readImageTags, writeImageTags};

export type fileType =
  "audio" | "image";

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

chalk.level = 1; // Use colors in the VS Code Debug Window

// Utilities to read and write metadata tags from an image file.
// Currently, we are interested in {Creator, License, Rights}

/**
 * Read the XMP metadata tags to get licensing info from an image file
 * @param file {string} - path to image file
 * @returns Promise<any> - tags in JSON format
 */
export async function readImageTags(file: string) : Promise<any> {
  //const tags = await exiftool.readRaw(file);
  let tags = await exiftool.readRaw(file, ['-all', '-xmp:all']);
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

  const tags2 = parseJSON(tags) as any;
  // Update Creator info
  if (tags2.hasOwnProperty('Creator')) {
    if (currentTags.Creator != tags2.Creator) {
      const warning = `WARNING: Overwriting ${path.basename(file)} existing creator: ${currentTags.Creator} with ${tags2.Creator}`;
      console.log(chalk.red(warning));
    }

    try {
      await exiftool.write(file,
        {Creator: tags2.Creator});
    } catch (err: any) {
      console.error("ERROR:", err.message);
    }
  }

  // Update License info
  if (tags2.hasOwnProperty('License')) {
    if (currentTags.License != tags2.License) {
      const warning = `WARNING: Overwriting ${path.basename(file)} existing license: ${currentTags.License} with ${tags2.License}`;
      console.log(chalk.red(warning));
    }

    /* TODO
    try {
      await exiftool.write(file,
        {License: tags2.License});
    } catch (err: any) {
      console.error("ERROR:", err.message);
    }
    */
  }

  // Update Rights info
  if (tags2.hasOwnProperty('Rights')) {
    if (currentTags.Rights != tags2.Rights) {
      const warning = `WARNING: Overwriting ${path.basename(file)} existing rights: ${currentTags.Rights} with ${tags2.Rights}`;
      console.log(chalk.red(warning));
    }

    try {
      await exiftool.write(file,
        {Rights: tags2.Rights});
    } catch (err: any) {
      console.error("ERROR:", err.message);
    }
  }

}
