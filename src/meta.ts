import {exiftool, parseJSON, Tags} from 'exiftool-vendored';

export default {readTags};

export async function readTags(file: string) : Promise<any> {
  const tags = await exiftool.readRaw(file);
  const str: string = JSON.stringify(tags);

  const tags2: Tags = parseJSON(str) as Tags;

  console.log(
    `Image ${tags2.FileName} has Artist: ${tags2.Artist}, Copyright: ${tags.Copyright}, File Modify Date: ${tags2.FileModifyDate}, Errors: ${tags2.errors}`
  );
  return tags2;
}