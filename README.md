## Simple Vector Tile Server

This repository has a very simple server.js file that dynamically creates vector tile endpoints from a directory of .mbtiles files. Unpacked protocol buffers in folder format are not supported. Meant for learning, not production! Updated version based on https://github.com/chelm/mbtiles-server and https://github.com/klokantech/tileserver-gl

### Usage

```
git clone git@github.com:dylrich/simple-vector-tile-server.git
cd simple-vector-tile-server
npm install
```

This will work if there is a directory called data with .mbtiles files in the same directory as server.js:

```
npm run start
```

If you want to specify your own port and directory

```
node server.js [PORT] [/directory/to/folder/with/mbtiles/files]
```

Check that the server is running by navigating to http://localhost:3000/states/3/1/2. You should see raw geojson data that can be consumed by a browser mapping library.
