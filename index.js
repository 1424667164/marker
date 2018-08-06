var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var app = express();

var api = new ParseServer({
  databaseURI: 'mongodb://localhost:20002/parse', // Connection string for your MongoDB database
  cloud: 'D:\\Works\\Learning\\marker\\cloud\\main.js', // Absolute path to your Cloud Code
  appId: '123456',
  masterKey: '123456', // Keep this key secret!
  fileKey: '123456',
  serverURL: 'http://172.16.1.209:1337/parse' // Don't forget to change to https if needed
});

// Serve the Parse API on the /parse URL prefix
app.use('/parse', api);

app.listen(1337, function() {
  console.log('parse-server-example running on port 1337.');
});