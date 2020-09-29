const path = require('path')
const fs = require('fs')
const minimatch = require('minimatch')
const mkdirp = require('mkdirp')
const archiver = require('archiver')

// borrowed heavily from https://github.com/elwin013/parcel-plugin-static-files-copy/blob/master/index.js
const getPackage = async (bundler) => {
  let mainAsset =
      bundler.mainAsset ||                                                // parcel < 1.8
      bundler.mainBundle.entryAsset ||                                    // parcel >= 1.8 single entry point
      bundler.mainBundle.childBundles.values().next().value.entryAsset;   // parcel >= 1.8 multiple entry points
  let pkg;
  if (typeof mainAsset.getPackage === 'function') {                       // parcel > 1.8
      pkg = (await mainAsset.getPackage());
  } else {                                                                // parcel <= 1.8
      pkg = mainAsset.package;
  }

  return pkg
}

// borrowed heavily from https://github.com/agentcooper/parcel-plugin-static-zip/blob/master/packages/plugin/index.js
const generateZip = async (source, destination, zipFile) => {
  console.log(`zipping all files in: ${source} to ${destination}/${zipFile}`)
  await mkdirp(destination)

  const output = fs.createWriteStream(path.join(destination, zipFile));
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.on("error", function(err) {
    throw err;
  });

  archive.on("warning", function(err) {
    if (err.code === "ENOENT") {
      console.warn(err);
    } else {
      throw err;
    }
  });

  output.on("close", function() {
    console.log(`${zipFile}: ${archive.pointer()}`);
  });

  archive.pipe(output);

  const finalOptions = {
    cwd: source,
  };

  archive.glob("**", finalOptions);
  archive.finalize();
}

module.exports = bundler => {
  bundler.on('bundled', async bundle => {
    const buildDirectory = bundler.options.outDir
    const package = await getPackage(bundler)
    const config = package.createZip || {}

    let output = null
    config.output.forEach((o) => {
      if (!output && minimatch(buildDirectory, o.outDirPattern, {})) {
        output = o
      }
    })

    if (output) {
      const zipFile = output.zip
      console.log(`generating ${zipFile}`)
      const destinationDirectory = path.join(path.resolve(config.path), `v${package.version}`)
      await generateZip(buildDirectory, destinationDirectory, zipFile)
    }
  })
}
