// db_insert.js
// read data from a file and insert it into the db_insert
const fs = require('fs');
const sqlite3 = require('sqlite3');

var db = new sqlite3.Database('junk.db');


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
};

function processThread(threadNumber, postArray) {
    console.log('processPost() postArray =', postArray);
    postArray.forEach(post => {
        processPost (threadNumber, post);
    });
};

const filePath = 'test_thread.json';
const threadNumber = '66564526';


fs.readFile(filePath, (err, fileData) => {
    if (err) {
        console.log(err);
    } else {
    var decodedFileData = JSON.parse(fileData);
    var postArray = decodedFileData.posts;
    console.log('postArray =', postArray);
    processThread(threadNumber, postArray);
    }
});


// console.log('Before db.close');
// db.close( () => {
//     console.log('Callback of DB.close')
// });
// console.log('After db.close');

console.log('Last line executed.');