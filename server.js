let MBTiles = require("@mapbox/mbtiles");
let VectorTile = require("@mapbox/vector-tile").VectorTile;
let Protobuf = require("pbf");
let fs = require("fs");
let zlib = require("zlib");
let express = require("express");

const port = process.argv[2];
const dataDirectory = process.argv[3];
const server = express();

// Array to hold all .mbtiles file names
let MVTFiles = [];

// Server will read the dataDirectory folder and create an Express endpoint for each .mbtiles file found there
fs.readdir(dataDirectory, (err, files) => {
  fileList = files;
  files.forEach(file => {
    if (file.endsWith(".mbtiles")) {
      MVTFiles.push(file);
    }
  });
  for (let MVT in MVTFiles) {
    MVT = MVTFiles[MVT];

    // Open the .mbtiles file for reading
    new MBTiles(dataDirectory + "/" + MVT, function(err, mbtiles) {
      if (err) throw err;
      let MVTName = MVT.substring(0, MVT.lastIndexOf("."));

      // Create Express endpoint for the opened .mbtiles file based off of its name
      server.get(`/${MVTName}/:z/:x/:y`, function(req, res) {
        // This block is reached on successful requests to the server
        let x = req.params["x"];
        let y = req.params["y"];
        let z = req.params["z"];
        mbtiles.getTile(z, x, y, function(err, tile, headers) {
          if (err) {
            res
              .status(404)
              .send(
                `Failed to get tile from ${MVTName}, ${z}, ${x}, ${y}: ` + err
              );
          } else {
            // Magic check for zipped vector tiles. Check taken from tileserver-gl at https://github.com/klokantech/tileserver-gl/blob/master/src/serve_data.js
            // If zipped, unzip first. Then create a new VectorTile dataset from the protocol buffer
            if (tile.slice(0, 2).indexOf(new Buffer([0x1f, 0x8b])) === 0) {
              tile = new VectorTile(new Protobuf(zlib.unzipSync(tile)));
            } else {
              tile = new VectorTile(new Protobuf(tile));
            }

            // We're going to return a geojson - initialize the geojson and create it from the tile data
            let geojson = {
              type: "FeatureCollection",
              features: []
            };

            //parsing the tile into a geojson
            for (let layerName in tile.layers) {
              let layer = tile.layers[layerName];
              for (let i = 0; i < layer.length; i++) {
                let feature = layer.feature(i);
                let fGeoJSON = feature.toGeoJSON(x, y, z);
                fGeoJSON.properties.layer = layerName;
                geojson.features.push(fGeoJSON);
              }
            }

            // response with stringified geojson and the correct header type
            let data = JSON.stringify(geojson);
            res.header("Content-Type", "application/json");
            res.send(data);
          }
        });
      });
    });
  }
  server.listen(port);
});
