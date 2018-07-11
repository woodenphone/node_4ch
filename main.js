// main.js
const fs = require('fs');
const sqlite3 = require('sqlite3');
const https = require('https');




var db = new sqlite3.Database('junk.db');
// Given a boardName and base siteURL:
const siteURL = 'https://a.4cdn.org'
const boardName = 'g'
// Given a threadID:
// sitck: https://boards.4chan.org/g/thread/51971506
var threadNumber = '66694211'
var threadURL = `${siteURL}/${boardName}/thread/${threadNumber}.json`


handleThread (db, threadNumber)






function handleThread (db, threadNumber) {
    console.log('handleThread() threadNumber =', threadNumber)
    // Load and decode the thread API page
    var threadURL = `${siteURL}/${boardName}/thread/${threadNumber}.json`
    var body = ''
    req = https.get(threadURL, (res) => {
        res.on('data', (chunk) => {
            body += chunk
        })
        res.on('end', () => {
            thread = JSON.parse(body)
            console.log('handleThread() thread =', thread)
            thread.posts.forEach( post => {
                //console.log('handleThread() post =', post)
                handlePost(db, threadNumber, post)
            })
        })
    })
    req.on('error', (err) => {
        console.log('error loading thread', err)
    })
}

function handlePost (db, threadNumber, post) {
    console.log('handlePost() post =', post)
    // Check if board, postID and threadID match a row in the DB, if so post has been processed already.
    db.get('SELECT post_id, thread_id, comment FROM posts WHERE post_id = $post_id AND thread_id = $thread_id', {
        $post_id: post.no,
        $thread_id: threadNumber
    }, (err, row) => {
        if (err) {
            console.log('handlePost SELECT db err', err)
            throw err
        }
        else {
            //console.log('row = ', row)
            if (row) {
                console.log('Post already in DB')
            }
            else {
                // For new posts...
                // If post has an image...
                if (post.md5) {
                    console.log('TODO Images')
                    // Check if image MD5 is in the DB, if not then image is new and must be saved.
                    // Load new image from site and save it to disk
                    // Insert new entry for image in DB
                }
                // Insert new entry for post in DB
                dbInsertPost(db, threadNumber, post)
            }
        }
    })
    console.log('handlePost() end=')
    return
}

function dbInsertPost (db, threadNumber, post) {
    // Insert new entry for post in DB
    // Put one post into the DB.
    //console.log(`Processing a post: ${post}`);
    console.log('dbInsertPost() post =', post)
    db.serialize( () => {
        var post_id = post.no
        var thread_id = threadNumber
        var comment = post.com;   
        db.run(
            'INSERT INTO posts (post_id, thread_id, comment) VALUES (?, ?, ?) ',
            post_id, thread_id, comment
        )
        console.log('Ran statement.');
    })
}