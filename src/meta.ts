import chalk from 'chalk';
import { exiftool, parseJSON, Tags} from 'exiftool-vendored';
import path from 'path';

// Utilities to read and write metadata tags from an image file.
// Currently, we are interested in {Creator, License, Rights}

export default {getTags, writeImageTags};

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

      tags: tags
    });
  });

  return linkedFiles;
}



/**
 * Get the current metadata tags from a list of image files. Then update
 * the tags we care about
 * @param files {string[]} - path to image files
 * @param newTags {string} - JSON Object of metadata tags
 */
export async function writeImageTags(files: string[], newTags: any) {
  const fileTags = await getTags(files);

  fileTags.forEach((currentTags, index) => {
    // Update Creator info
    if (newTags.hasOwnProperty('Creator')) {
      if (currentTags.creator != newTags.Creator) {
        const warning = `WARNING: Overwriting ${path.basename(currentTags.fileName)} existing creator: ${currentTags.creator} with ${newTags.Creator}`;
        console.log(chalk.red(warning));
      }

      try {
        exiftool.write(files[index],
          {'XMP:Creator': newTags.Creator},
          ['-overwrite_original']);
      } catch (err: any) {
        console.error("ERROR:", err.message);
      }
    }

    // Update License info
    if (newTags.hasOwnProperty('License')) {
      if (currentTags.license != newTags.License) {
        const warning = `WARNING: Overwriting ${path.basename(currentTags.fileName)} existing license: ${currentTags.license} with ${newTags.License}`;
        console.log(chalk.red(warning));
      }

      try {
        exiftool.write(files[index],
          {'XMP:License': newTags.License},
          ['-overwrite_original']);
      } catch (err: any) {
        console.error("ERROR:", err.message);
      }
    }

    // Update Rights info
    if (newTags.hasOwnProperty('Rights')) {
      if (currentTags.rights != newTags.Rights) {
        const warning = `WARNING: Overwriting ${path.basename(currentTags.fileName)} existing rights: ${currentTags.rights} with ${newTags.Rights}`;
        console.log(chalk.red(warning));
      }

      try {
        exiftool.write(files[index],
          {'XMP:Rights': newTags.Rights});
      } catch (err: any) {
        console.error("ERROR:", err.message);
      }
    }
  });
}
