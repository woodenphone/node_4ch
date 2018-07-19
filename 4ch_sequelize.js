// 4ch_sequelize.js
// Save 4chan threads/posts/media using a DB
// Library imports
const jsonFile = require('jsonfile')
const fs = require('fs-extra');
const lupus = require('lupus');
const Sequelize = require('sequelize');
const rp = require('request-promise')
const rp_errors = require('request-promise/errors');
const request = require('request');// for file streaming
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 1000);

// Setup logging
const tracer = require('tracer')
var logger = tracer.colorConsole({
	transport : function(data) {
		console.log(data.output);
		fs.appendFile('./debug/4ch_sequelize.log', data.rawoutput + '\n', (err) => {
			if (err) throw err;
		});
    },
});
tracer.setLevel('debug')
logger.info('Logging started.')

// Local imports
const db = require('./4ch_sequelize_database.js')// DB schema and setup
  



const siteURL = 'https://a.4cdn.org'
const boardName = 'g'
const threadID = '66770725'


// var testThreadData = jsonFile.readFileSync('git_ignored\\test_thread.json');
// logger.log('info', 'testThreadData', {'testThreadData':testThreadData})
// var testThreadID = testThreadData.posts[0].no// TODO Find safer way to generate threadID
// var testPostData = testThreadData.posts[0]
// console.log('testPostData', testPostData)



// // A post for testing
// testThreadID = 66564526
// testPostData = {
//     "no":66564526,
//     "closed":1,
//     "now":"07\/01\/18(Sun)00:45:53",
//     "name":"Anonymous",
//     "sub":"\/dpt\/ - Daily Programming Thread",
//     "com":"old thread: <a href=\"\/g\/thread\/66555693#p66555693\" class=\"quotelink\">&gt;&gt;66555693<\/a><br><br>What are you working on, \/g\/?",
//     "filename":"i brought programmer!",
//     "ext":".png",
//     "w":1280,
//     "h":720,
//     "tn_w":250,
//     "tn_h":140,
//     "tim":1530420353413,
//     "time":1530420353,
//     "md5":"rC2BsoSAoLbE8UiQN8uBjw==",
//     "fsize":745037,
//     "resto":0,
//     "archived":1,
//     "bumplimit":1,
//     "archived_on":1530484735,
//     "imagelimit":0,
//     "semantic_url":"dpt-daily-programming-thread",
//     "replies":375,
//     "images":29,
//     "tail_size":50
// }




// Create tables
// force: true will drop the table if it already exists
db.Post.sync({ force: false }).then(db.Image.sync({ force: false })).then(db.Thread.sync({ force: false }))
// Insert a thread
// .then(handleThreadData(testThreadData));
// .then(decideThenInsertPost(testPostData));
.then(handleThread(siteURL, boardName, threadID));
// .then(handleWholeThreadAtOnce(siteURL, boardName, threadID));


// Functions that check if a post is something
function isPostSticky(postData) {
    //Non-sticky posts will lack 'sticky' key or have it set to false
    // Sticky posts will have post.sticky === 1
    return (postData.sticky == 1)
}

function isPostOP(postData,threadID){
    return (postData.no == threadID)
}

function isPostLocked(postData) {
    return (postData.closed == 1)
}

function isPostSpoiler(postData) {
    return (postData.spoiler == 1)
}
// /Functions that check if a post is something

// Functions that check something about a thread
function getThreadTimeLastBumped(threadData) {
    return threadData.posts[threadData.posts.length-1].time
}

function getThreadTimeLastModified(threadData) {
    return threadData.posts[threadData.posts.length-1].time
}
function getThreadTimeLast(threadData) {
    return threadData.posts[threadData.posts.length-1].time
}
// /Functions that check something about a thread



function handleWholeThreadAtOnce(siteURL, boardName, threadID) {
    // Load a thread from the API; lookup all its posts at once; insert new posts; update existing posts
    // Generate API URL
    var threadURL = `${siteURL}/${boardName}/thread/${threadID}.json`
    logger.info('handleWholeThreadAtOnce() processing thread: ',threadURL)
    // Load thread API URL
    rp(threadURL)
    .then( (htmlString) => {
        // Decode JSON
        threadData = JSON.parse(htmlString)
        // Process thread data
        // Extract thread-level data from OP
        var opPostData = threadData.posts[0]
        var threadID = opPostData.no
        // Lookup threadID in the DB
        return db.Thread.findOne({
            where:  {
                threadNumber: threadID,
            }
        }).then( (threadRow) => {
            if (threadRow) {
                logger.debug('Thread already in DB: ', threadID)
            } else {
                logger.debug('Creating entry for thread: ', threadID)
                // Create entry for thread
                db.Thread.create({
                    threadNumber: threadID,
                    time_op: opPostData.time,//TODO
                    time_last: getThreadTimeLast(threadData),//TODO
                    time_bump: getThreadTimeLastBumped(threadData),//TODO find better way of calculating this value
                    time_ghost: null,//TODO
                    time_ghost_bump: null,//TODO
                    time_last_modified: getThreadTimeLastModified(threadData),//TODO Should be calculating by inspecting every post, and updating db to highest only if the highest is greater than the DB
                    nreplies: opPostData.replies,//TODO We should actually count the entries in the DB
                    nimages: opPostData.images,//TODO We should actually count the entries in the DB
                    sticky: isPostSticky(opPostData),
                    locked: isPostLocked(opPostData),
                }).then( (threadRow) => {
                    logger.trace('Thread added to DB: ', threadRow)
                })
            }
        }).then( () => {
            // Load existing posts from DB
            db.Post.findAll({
                where:  {
                    thread_num: threadID,
                }
            }).then( (postRows) => {
                logger.trace('handleWholeThreadAtOnce() postRows', postRows)
                logger.debug('handleWholeThreadAtOnce() postRows.length ', postRows.length)
                // Compare data for each post in the DB against the API

                // Find posts in DB but not in API (deleted)
                deletedPostRows = compareFindDeletedPostRows(postRows, apiPosts=threadData.posts)
                logger.debug('handleWholeThreadAtOnce() deletedPostRows.length ', deletedPostRows.length)
                // Insert posts in DB but not in API (deleted)
                np = Promise.all(deletedPostRows.map(function (postData) {
                    postID = postData.no
                    return markPostDeleted(postData, threadID);
                })).then(function (arrayOfResults) {
                    logger.trace('handleWholeThreadAtOnce() np() arrayOfResults', arrayOfResults)
                })
                
                // Deal with posts in DB and in API (meh.)
                // TODO

                // Find posts in not DB but in API (new)
                newApiPosts = compareFindNewApiPosts(postRows, apiPosts=threadData.posts)
                logger.debug('handleWholeThreadAtOnce() newApiPosts.length ', newApiPosts.length)
                // Update posts in not DB but in API (new)
                dp = Promise.all(newApiPosts.map(function (postRow) {
                    postID = postRow.postNumber
                    return insertPost(postID, threadID);
                })).then(function (arrayOfResults) {
                    logger.trace('handleThread() dp() arrayOfResults', arrayOfResults)
                })

            })
        })
    })
}

function markPostDeleted(postID, threadID) {
    // Mark a given post as deleted
    logger.debug('markPostDeleted(): ', postID, threadID)
    db.Post.update(
        {
            deleted: 1,
        },{
        where: {
            post_number: postID,
            thread_num: threadID
            }
        }
    ).then( (result) => {
        logger.debug('markPostDeleted(): ', result)
    })
}

function compareFindDeletedPostRows (postRows, apiPosts) {
    // Produce an array of post DB rows  that do not match the 4ch API post objects
    logger.trace('compareFindDeletedPostRows()', postRows, apiPosts)
    var deletedPostRows = []
    for (let i = 0; i< postRows.length-1; i++){
        postRow = postRows[i]
        var matched = false
        for (let j = 0; j< apiPosts.length-1; j++){
            apiPost = apiPosts[j]
            if (dbPost.postNumber == apiPost.no) {
                matched = true// If in DB but not API
            }
        }
        if (matched){
            deletedPostRows.push(postRow)
        }
    }
    logger.trace('compareFindDeletedPostRows() deletedPostRows', deletedPostRows)
    return deletedPostRows
}

function compareFindNewApiPosts (postRows, apiPosts) {
    // Produce an array of 4ch API post objects that do not match any item in the given post DB rows
    logger.trace('compareFindNewApiPosts()', postRows, apiPosts)
    var newApiPosts = []
    for (let i = 0; i< apiPosts.length-1; i++){
        apiPost = apiPosts[i]
        var matched = false
        for (let j = 0; j< postRows.length-1; j++){
            dbPost = postRows[j]
            if (dbPost.postNumber == apiPost.no) {
                matched = true// If in API but not DB
            }
        }
        if (matched){
            newApiPosts.push(apiPost)
        }
    }
    logger.trace('compareFindNewApiPosts() newApiPosts', newApiPosts)
    return newApiPosts
}




function handleThread(siteURL, boardName, threadID) {
    // Load a thread from the API; then lookup and insert it, its posts, and its media
    // Generate API URL
    var threadURL = `${siteURL}/${boardName}/thread/${threadID}.json`
    logger.info('handleThread() processing thread: ',threadURL)
    // Load thread API URL
    rp(threadURL)
    .then( (htmlString) => {
        // Decode JSON
        threadData = JSON.parse(htmlString)
        // Process thread data
        handleThreadData (threadData)
    })    
}

function handleThreadData (threadData) {
    // Check if thread has entry in the db; if not make one; then lookup and insert its posts and media.
    // Extract thread-level data from OP
    var opPostData = threadData.posts[0]
    var threadID = opPostData.no
    // Lookup threadID in the DB
    return db.Thread.findOne({
        where:  {
            threadNumber: threadID,
        }
    }).then( (threadRow) => {
        if (threadRow) {
            logger.debug('Thread already in DB: ', threadID)
        } else {
            logger.debug('Creating entry for thread: ', threadID)
            // Create entry for thread
            db.Thread.create({
                threadNumber: threadID,
                time_op: opPostData.time,//TODO
                time_last: getThreadTimeLast(threadData),//TODO
                time_bump: getThreadTimeLastBumped(threadData),//TODO find better way of calculating this value
                time_ghost: null,//TODO
                time_ghost_bump: null,//TODO
                time_last_modified: getThreadTimeLastModified(threadData),//TODO Should be calculating by inspecting every post, and updating db to highest only if the highest is greater than the DB
                nreplies: opPostData.replies,//TODO We should actually count the entries in the DB
                nimages: opPostData.images,//TODO We should actually count the entries in the DB
                sticky: isPostSticky(opPostData),
                locked: isPostLocked(opPostData),
            }).then( (threadRow) => {
                logger.trace('Thread added to DB: ', threadRow)
            })
        }
    }).then( () => {
        iterateThreadPosts(threadData, threadID)
    })
}

function iterateThreadPosts(threadData, threadID) {
    // Check the DB for posts and insert them and their media if absent
    logger.trace('Iterating over test thread:',threadData)
    lupus(0, threadData.posts.length, (n) => {
        logger.trace('processing post index:', n)
        var postData = threadData.posts[n]
        decideThenInsertPost(postData, threadID)
    }, () => {
        logger.trace('finished lupus loop')
    })
}

function decideThenInsertPost (postData, threadID) {
    // Check the DB for a post and insert it and its media if absent
    logger.debug('decideThenInsertPost() postData.no:', postData.no)
    // Does post exist in DB?
    db.Post.findOne({
        where:  {
            postNumber: postData.no,
            thread_num: threadID,
        }
    }).then( (existingVersionOfPost) => {
        logger.trace('existingVersionOfPost', existingVersionOfPost)
        if (existingVersionOfPost) {
            logger.debug(`Post ${existingVersionOfPost.postNumber} is already in the DB`)
        } else {
            logger.debug('Post is not in the DB')
            insertPost(postData, threadID)
        }
    })
}

function insertPost(postData, threadID) {
    // Insert a post without looking at the DB first
    logger.debug('insertPost()', postData.no)
    // logger.debug('Post is not in the DB')
    // If post has a file ?post.md5 !== ''?
    if (postData.md5) {
        logger.debug(`Post ${postData.no} has an image`)
        // Lookup MD5 in DB
        db.Image.findOne({
            where:{media_hash: postData.md5}
        }).then( (existingVersionOfImageRow) => {
            logger.trace('imgTest existingVersionOfImageRow', existingVersionOfImageRow)
            if (existingVersionOfImageRow) {
                logger.debug('Image is already in the DB')
                // If MD5 found, use that as our entry in media table
                mediaID = existingVersionOfImageRow.id
                logger.debug('mediaID: ', mediaID)
                insertPostFinal(postData, threadID, mediaID)
            } else {
                logger.debug(`Image ${postData.md5} is not in the DB`)
                // If no MD5 found, create new entry in media table and use that
                // Fetch the media files for the post
                // Decide where to save each file
                // Images: http(s)://i.4cdn.org/board/tim.ext
                var fullURL = `https://i.4cdn.org/${boardName}/${postData.tim}${postData.ext}`
                var fullFilePath = `debug/${boardName}/${postData.tim}${postData.ext}`
                // Thumbnails: http(s)://i.4cdn.org/board/tims.jpg
                var thumbURL = `https://i.4cdn.org/${boardName}/${postData.tim}s${postData.ext}`
                var thumbFilePath = `debug/${boardName}/thumb/${postData.tim}s.jpg`
                // Save full image
                downloadMedia(fullURL, fullFilePath)
                // Save thumb
                downloadMedia(thumbURL, thumbFilePath)
                // Insert row into Images table
                db.Image.create({
                    media_hash: postData.md5,
                    media: fullFilePath,// TODO Verify format Asagi uses
                    preview_op: 'local/path/to/preview_op.ext',// TODO
                    preview_reply: thumbFilePath,// TODO Verify format Asagi uses
                }).then( (imageRow) => {
                    logger.trace('Image added to DB: ', imageRow)
                    mediaID = imageRow.id
                    logger.debug('mediaID: ', mediaID)
                    insertPostFinal(postData, threadID, mediaID)
                })
            }
        })
    } else {
        logger.debug(`Post ${postData.no} has no image`)
        mediaID = null// We don't have media for this post, so use null
        logger.trace('mediaID: ', mediaID)
        insertPostFinal (postData, threadID, mediaID)
    }
}

function downloadMedia(url, filepath) {
    // Save a target URL to a target path
    logger.debug('Saving URL: ', url, 'to filepath: ',filepath)
    limiter.removeTokens(1, function() {
        logger.trace('Limiter fired.')
        // return
        request.get(url)
        // .catch(rp_errors.StatusCodeError, function (reason) {
        //     logger.error('downloadMedia() caught StatusCodeError', reason)
        //     // The server responded with a status codes other than 2xx.
        //     // Check reason.statusCode
        //     if (reason.statusCode == 404) {
        //         //TODO Handle 404
        //     }
        // })
        .on('error', function(err) {
            logger.error('downloadMedia() err', err)
            console.log('downloadMedia() err ',err)
            raise(err)
        }).pipe(fs.createWriteStream(filepath))
        // }).then( (data) => {
        //     // Save data to disk
        //     fs.writeFile(filepath, data, (err) => {
        //         if(err) {
        //             logger.error(err);
        //             //TODO Retry
        //         } else {
        //             // TODO handle success
        //         }
        //     })
        // })
    })
}

function insertPostFinal (postData, threadID, mediaID) {
    // Insert the post's data
    logger.debug('Inserting post data')
    return db.Post.create({
        postNumber: postData.no,
        thread_num: threadID,
        name: postData.name,
        title: postData.sub,
        comment: postData.com,
        op: isPostOP(postData,threadID),
        timestamp: postData.time,
        media_id: mediaID,
        spoiler: isPostSpoiler(postData),
        preview_orig: null,//TODO
        preview_w: postData.tn_w,//TODO
        preview_h: postData.tn_h,//TODO
        media_filename: null,//TODO
        media_w: postData.w,//TODO
        media_h: postData.h,//TODO
        media_size: postData.fsize,//TODO
        media_hash: postData.md5,//TODO
        media_orig: null,//TODO
    }).then( (postCreatePostResult) =>{
        return logger.trace('postCreatePostResult ',postCreatePostResult)
    })
}


