// main.js
// fetch the posts from a given 4chan thread and stuff them into the DB
const https = require('https');
const sqlite3 = require('sqlite3');
var db = new sqlite3.Database('junk.db');

// function Post () {
//     this.id;
//     this.threadId;
//     this.comment;
// }

function processPost (threadNumber, post) {
    // Put one post into the DB.
    //console.log(`Processing a post: ${post}`);
    console.log('processPost() post =', post);
    db.serialize( () => {
        var post_id = post.no;
        var thread_id = threadNumber;
        var comment = post.com;    
        db.run('INSERT INTO posts (post_id, thread_id, comment) VALUES (?, ?, ?)',
        post_id, thread_id, comment
        );
        console.log('Ran statement.');
    });
}


function processPosts(board, threadNumber, postArray) {
    postArray.posts.forEach( (post) => {
        // Put one post into the DB.
        processPost(threadNumber=threadNumber, post=post);
    });
}


function processThread(board, threadNumber, body) {
    // Process JSON from 4chan.
    var postArray = JSON.parse(body.toString());
    processPosts(board, threadNumber, postArray);
}

// function loadURL(url) {

// }

function fetchThread (board, threadNumber) {
    // Choose the URL
    var threadURL = `https://a.4cdn.org/${board}/thread/${threadNumber}.json`;
    // Get the thread data
    https.get(threadURL, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);
        var body = '';
        res.on('data', (d) => {
            body += d;
          });
        // Once the page has finished loading:
        res.on('end', processThread(board, ThreadNumber, body) );
    // Handle network errors and such.
    }).on('error', (e) => {
        console.error('ERROR:', e);
    });
}


db.serialize( () => {
    fetchThread( 'g', '66564526');
})

//db.close();