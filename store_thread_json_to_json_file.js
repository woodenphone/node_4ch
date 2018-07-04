// store_thread_json_to_json_file.js

const fs = require('fs');
const https = require('https');



var threadURL = `https://a.4cdn.org/g/thread/66564526.json`;
var  savePath = 'test_thread.json';

// Get the thread data
https.get(threadURL, (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);
    var body = '';
    res.on('data', (d) => {
        body += d;
      });
    // Once the page has finished loading:
    res.on('end', () => {
        //
        fs.writeFile(path = savePath, data = body, (err) => {
        });
    });
// Handle network errors and such.
}).on('error', (e) => {
    console.error('ERROR:', e);
});






