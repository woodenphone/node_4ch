// main.js
// fetch the posts from a given 4chan thread and stuff them into the DB
const https = require('https');
const sqlite3 = require('sqlite3');
var db = new sqlite3.Database('junk.db');



function fetchThread (board, threadNumber) {
    // Choose the URL
    var threadURL = `https://a.4cdn.org/${board}/thread/${threadNumber}.json`;
    // Get the thread data
    https.get(threadURL, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);
        
        res.on('data', (d) => {
            // Process JSON from 4chan
            var postArray = JSON.parse(d.toString());
            postArray.forEach( (thisPost) => {
                // Put one post into the DB
                console.log('Post Data:', thisPost)
            });

          });

        }).on('error', (e) => {
            console.error('ERROR:', e);
          });
        
    
};

fetchThread( 'g', '66564526');