// main.js
const fs = require('fs');
const sqlite3 = require('sqlite3');
const https = require('https');
const async = require('async');



var db = new sqlite3.Database('junk.db');
// Given a boardName and base siteURL:
const siteURL = 'https://a.4cdn.org'
const boardName = 'g'
// Given a threadID:
// sitck: https://boards.4chan.org/g/thread/51971506
var threadNumber = '66694211'
var threadURL = `${siteURL}/${boardName}/thread/${threadNumber}.json`


//handleThread (db, siteURL, boardName, threadNumber)
handleBoardCatalog (db, siteURL, boardName)

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}


function parseCatalog(catalog) {
    console.log('parseCatalog() boardName =', catalog)
    // Join the pages
    var threads = []
    // for (var key in catalog) {
    //     if (catalog.hasOwnProperty(key)) {
    //         threads.push(catalog[key].threads)
    //     }
    // }
    catalog.forEach( page => {
        page.threads.forEach( thread => {
            threads.push(thread)
        })
    })
    console.log('parseCatalog() threads =', boardName)
    return threads
}

function handleBoardCatalog (db, siteURL, boardName) {
    console.log('handleBoardCatalog() boardName =', boardName)
    // Get a list of threads
    var catalogURL = `${siteURL}/${boardName}/catalog.json`
    var body = ''
    req = https.get(catalogURL, (res) => {
        res.on('data', (chunk) => {
            body += chunk
        })
        res.on('end', () => {
            catalog = JSON.parse(body)
            console.log('handleBoardCatalog() catalog =', catalog)
            threads = parseCatalog(catalog)

            // threads.forEach( (thread) => {
            //     handleThread(db, siteURL, boardName, threadNumber=thread.no)
            // })

            // Handle just one thread until I figure out how to ratelimit
            handleThread(db, siteURL, boardName, threadNumber=threads[2].no)
        })
    })
    req.on('error', (err) => {
        console.log('Error loading catalog', err)
    })
}


function handleThread (db, siteURL, boardName, threadNumber) {
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
                return
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
    db.get('SELECT post_id, thread_id, comment FROM posts '+ 
        'WHERE post_id = $post_id AND thread_id = $thread_id', {
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
                console.log('Post already in DB. row = ', row)
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
    console.log('handlePost() end')
    return
}

function dbInsertPost (db, threadNumber, post) {
    // Insert new entry for post in DB
    // Put one post into the DB.
    //console.log(`Processing a post: ${post}`);
    console.log('dbInsertPost() post =', post)
    db.serialize( () => {
        db.run(
            'INSERT INTO posts (doc_id, '+
            'media_id, poster_ip, num, subnum, thread_num, '+
            'op, timestamp, timestamp_expired, preview_orig, '+
            'preview_w, preview_h, media_filename, media_w, media_h, '+
            'media_size, media_hash, media_orig, spoiler, deleted, '+
            'capcode, email, name, trip, title, '+
            'comment, delpass, sticky, locked, poster_hash, poster_country, exif) '+
            'VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',{
                $doc_id: NaN,// TODO: this should probably be autoincriment
                $media_id: NaN,// TODO
                $poster_ip: NaN,// TODO
                $num: post.no,// Board-specific post ID number
                $subnum: 0,// TODO
                $thread_num: threadNumber,// Board-specific threadID number which is also the postID of the first post of the thread
                $op: (post.num == threadNumber),// TODO ?derivve from post.resto?
                $timestamp: post.time,// TODO ?time? 
                $timestamp_expired: post.archived_on,// TODO ?archived_on?
                $preview_orig: NaN,// TODO
                $preview_w: post.tn_w,// TODO: Check if Asagi accepts the API value or calculates from the image
                $preview_h: post.tn_h,// TODO: Check if Asagi accepts the API value or calculates from the image
                $media_filename: post.filename,
                $media_w: post.w,// TODO: Check if Asagi accepts the API value or calculates from the image
                $media_h: post.h,// TODO: Check if Asagi accepts the API value or calculates from the image
                $media_size: post.fsize,// TODO: Check if Asagi accepts the API value or calculates from the image
                $media_hash: post.md5,// TODO: Check if Asagi accepts the API value or calculates from the image file
                $media_orig: NaN,// TODO
                $spoiler: post.spoiler,
                $deleted: NaN,// TODO
                $capcode: post.capcode,
                $email: NaN,// TODO
                $name: post.name,
                $trip: post.trip,
                $title: post.sub,
                $comment: post.com,
                $delpass: NaN,// TODO
                $sticky: post.sticky,// TODO: Check if asagi rechecks/retains this value somehow
                $locked: post.closed,// TODO: Check if asagi rechecks/retains this value somehow
                $poster_hash: NaN,// TODO
                $poster_country: NaN,// TODO
                $exif: NaN,// TODO
            }
        )
        console.log('Ran statement.');
    })
}