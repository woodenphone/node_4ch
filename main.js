// main.js
// fetch the posts from a given 4chan thread and stuff them into the DB
const https = require('https');
const sqlite3 = require('sqlite3');
var db = new sqlite3.Database('junk.db');

// function Post () {
//     this.id;
//     this.threadId;
//     this.comment;
// };

function processPost (threadNumber, postObj) {
    // Put one post into the DB.
    //console.log(`Processing a post: ${postObj}`);
    console.log('Post Data:', postObj);
    // Prepare insert statement.
    var statement = db.prepare('INSERT INTO posts VALUES (ROWID, ?, ?, ?)');
    // Collect values.
    var post_id = postObj.no;
    var comment = postObj.com;
    // Put values into insert statement.
    statement.run('post_id ' + post_id);
    statement.run('thread_id ' + threadNumber);
    statement.run('comment ' + comment);
    // Execute insert statement.
    statement.finalize();
    console.log('Ran statement.');
};

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
        res.on('end', () => {
            // Process JSON from 4chan.
            var postArray = JSON.parse(body.toString());
            postArray.posts.forEach( (thisPost) => {
                // Put one post into the DB.
                processPost(threadNumber=threadNumber, postObj=thisPost);
            });
        });
    // Handle network errors and such.
    }).on('error', (e) => {
        console.error('ERROR:', e);
    });
};


db.serialize( () => {
    fetchThread( 'g', '66564526');
});

//db.close();