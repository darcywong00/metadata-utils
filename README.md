# Metadata Utils

Retrieves/updates XMP metadata from audio/image files relating to licensing.
Uses [exiftools](https://exiftools.org)

* Creator - Name / Organization
* License - Preferably to set to [Creative Commons](https://creativecommons.org/licenses/by-nc-sa/4.0/)
* Rights (copyright holder)

## Parameters

**Requred** - one of:

-f --files [list of files]

-p --projectPath [path to Fieldworks project]

**Optional**

-t --tags \<JSON Object of metadata tags to write>  

Recommended example:
```JSON
{
  "Creator": "<Creator of the file>"
  "License": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
  "Rights": "(c) <year> <Rights holder>"
}
```

If specified, metadata tags to write to the file(s)/project.
Use an empty string to overwrite an existing field.

## Pre-requisite
Install the current LTS of [nodejs](https://nodejs.org/).
