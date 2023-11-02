# Metadata Utils

Retrieves/updates XMP metadata from audio/image files relating to licensing.
Uses [exiftools](https://exiftools.org)

* Creator - Name / Organization
* License - Preferably to set to [Creative Commons](https://creativecommons.org/licenses/by-nc-sa/4.0/)
* Rights (copyright holder)

## Parameters

**Required** - one of:

-f --files [list of files, separated by commas]

-p --projectPath [path to Fieldworks project]

Metadata-utils will then find all the audio/image files given and update tags according to optional parameters below

**Optional**

-t --tags \<string of JSON Object of metadata tags to write>  

Recommended example of JSON string:
```
{\"creator\": \"<Creator of the file>\", \"license\": \"https://creativecommons.org/licenses/by-nc-sa/4.0/\", \"rights\": \"(c) <year> <rights holder>\"}"
```

-j --json [path to JSON file containg tags to write]

Recommended example of JSON content:
```JSON
{
  "creator": "<Creator of the file>"
  "license": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
  "rights": "(c) <year> <Rights holder>"
}
```

If a parameter for metadata tags (`--tags` or `--json`) are specified, they'll be written to the file(s)/project.
Use an empty string to overwrite an existing field.

If none of the optional parameters are given, the metadata tags are just read for the files.

## Pre-requisite
Install the current LTS of [nodejs](https://nodejs.org/).
