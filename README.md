# pacel-plugin-create-zip
---
created for a very specific purpose of zipping up a subdirectory under the dist folder, should be updated to accept other options and be more generally useful

config example:
```
  "createZip": {
    "path": "./versions",
    "output": [
      {
        "outDirPattern": "**/production",
        "zip": "production.zip"
      },
      {
        "outDirPattern": "**/production-debug",
        "zip": "production-debug.zip"
      }
    ]
  }
```
