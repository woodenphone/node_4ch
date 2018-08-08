"use strict";
// 4ch_sequelize_asagi.js
// Save 4chan threads/posts/media using a DB with the tables Asagi uses
// Library imports
// const jsonFile = require('jsonfile')
const fs = require('fs-extra');
const path = require('path')
// const lupus = require('lupus');
const Sequelize = require('sequelize');
const rp = require('request-promise')
const rp_errors = require('request-promise/errors');
const request = require('request');// for file streaming
// const assert = require('assert');
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 1500);// MUST be above 1000

// Setup logging
const tracer = require('tracer')
var logger = tracer.colorConsole({
	transport : function(data) {
		console.log(data.output);
		fs.appendFile('./debug/4ch_sequelize_asagi.log', data.rawoutput + '\n', (err) => {
			if (err) throw err;
		});
    },
});
tracer.setLevel('debug')
logger.info('Logging started.')



// Local imports
const db = require('./sequelize_asagi_tables')// Asagi-style DB schema and setup
const classes = require('./yet_another_model')// Class definitions



const global_siteURL = 'https://a.4cdn.org'
const global_boardName = 'g'
const global_savepath = 'debug/'
//const global_threadID = '66770725'



// Start doing things
main();

function main() {
    // Run stuff 
    // Create tables
    // force: true will drop the table if it already exists
    db.Post.sync({ force: false })
    .then(db.Image.sync({ force: false }))
    .then(db.Thread.sync({ force: false }))
    // Grab threads
    .then(handleApiThreadsPage(global_siteURL, global_boardName))
    // .then(memCachedGrabBoard(global_siteURL, global_boardName))
    .catch( (err) => {
        logger.error(err)
    });
};

// function memCachedGrabBoard (siteURL, boardName) {
//     importDbRecentThreads(5)
//     .then( (threadsCache) => {
//         logger.debug('a')
//         memCachedScanBoard(threadsCache, siteURL, boardName)
//         logger.debug('b')
//     })
// }
  

// function memCachedScanBoard (threadsCache, siteURL, boardName) {
//     // Process threads from the API's threads.json endpoint
//     logger.debug('Processing threads.json for board: ',boardName)
//     var threadsUrl = `${siteURL}/${boardName}/threads.json`
//     fetchApiJson(threadsUrl)
//     .then( (apiThreads) => {
//         var apiThreadPairs = joinApiThreadsLists(apiThreads)
//         // Decide which threads to grab
//         for (var i = 0; i< apiThreadPairs.length; i++){
//             var threadId = apiThreadPairs[i].no
//             var lastModified = apiThreadPairs[i].last_modified
//             var thread = getCacheThread(threadsCache, threadId)
//             // Ensure we have a Thread object to do comparisons on
//             if (! (thread) ) {
//                 logger.debug('New thread: ',threadId)
//                 thread = new classes.Thread(thread_num = threadId, lastGrabbed = 0)
//             }
//             // Check if we want to update this thread
//             if (thread.lastGrabbed < lastModified) {
//                 // Grab thread
//                 logger.debug('Thread needs update: ',threadId)
//                 handleWholeThreadAtOnce(siteURL, boardName, threadId)
//                 .then( () => {
//                     thread.lastGrabbed = Date.now()
//                 })
//             } else {
//                 logger.debug('Ignoring thread: ',threadId)
//             }
//         }
//     })
//     return threadsCache
// }

// function getCacheThread(threadsCache, threadId) {
//     var match
//     for (var i = 0; i< pageThreads.length; i++){
//         thread = threadsCache[i]
//         if (thread.thread_num === threadId) {
//             match = thread
//             break
//         }
//     }
//     return match
// }

// function importDbRecentThreads(numberOfRows) {
//     // Query the database for the most recent entries in the threads table,
//     // returning the resulting rows as Thread objects
//     return new Promise( function (resolve, reject) {
//         logger.debug('Loading recent threads')
        
//         // Get recent threads
//         return db.Thread.findAll({// We want the most recent threads
//             order: ['thread_num'],
//             limit: numberOfRows,// LIMIT numberOfRows
//         })
//         .then( (threadRows) => {
//             var threadCache = []
//             logger.debug('got threadRows. threadRows=', threadRows)
//             // TODO: handle case when 0 thread rows, i.e. virgin table
//             // Instantiate Thread objects
//             for (var threadRow of threadRows) {
//                 var newThread = instantiateThreadAndPostsFromDb(threadRow)// Instantiate one thread and its posts
//                 threadCache.push(newThread)
//             }
//             logger.debug('importDbRecentThreads resolving. threadCache=',threadCache)
//             resolve(threadCache)
//         })
//     })
// }

// function instantiateThreadAndPostsFromDb(threadRow) {
//     var threadRow = threadRow
//     // Given a row from the threads table, instantiate a thread cache object for it and its posts
//     return new Promise( function (resolve, reject) {
//         var thread_num = threadRow.thread_num
//         var lastModified = threadRow.time_last
//         var thread = new classes.Thread(thread_num, lastModified)
//         // Instantiate Thread objects with values from DB
//         // SELECT posts matching thread_num
//         return db.Post.findAll(
//             {
//             where:  {
//                 thread_num: threadId,
//                 },
//             }
//         ).then( (postRows) => {
//             // TODO: Error on 0 post rows
            
//             // Add posts to thread
//             return populateThreadFromBdRows(postRows, thread)
//         }).then( (thread) => {
//             resolve(thread)// Return a fully populated thread
//         })
//     })
// }

// function populateThreadFromBdRows (postRows, thread) {
//     // Given a thread object and set of DB rows, add the rows as posts to the thread object
//     return new Promise( function (resolve, reject) {
//         // Instantiate post objects with appropriate DB values
//         for (var postRow of postRows) {
//             // Instantiate one post and add it to the thread
//             num = postRow.num
//             post = new classes.Post(num)
//             thread.posts.push(post)
//         }
//         logger.debug('breakpoint')
//         resolve(thread)// Return a fully populated thread
//     })
// }


function handleApiThreadsPage(siteURL, boardName) {
    // Process threads from the API's threads.json endpoint
    logger.debug('Processing threads.json for board: ',boardName)
    var threadsUrl = `${siteURL}/${boardName}/threads.json`
    fetchApiJson(threadsUrl)
    .then( (apiThreads) =>{
    logger.trace('apiThreads: ',apiThreads)
    // get a list of threadIds
    // var threadsList = joinApiThreadsLists(apiThreads)
    // logger.debug('threadsList: ',threadsList)
    var threadIds = joinApiThreadsListsIds(apiThreads)
    logger.trace('threadIds: ',threadIds)
    // handleMultipleThreadsSequentially(siteURL, boardName, threadIds)
    handleMultipleThreadsSequentiallyWithMediaAlso(siteURL, boardName, threadIds)
    logger.debug('Finished processing threads.json for board: ',boardName)
    })
}

// function insertThread(threadData) {
//     var threadURL = `${siteURL}/${boardName}/thread/${threadId}.json`
//     logger.info('processing thread: ',threadURL)
//     // Load thread API URL
//     var posts = []
//     fetchApiJson(threadURL)
//     .then( (threadData) => {
//         posts
//     })
//     return posts
// }

// function joinApiThreadsLists (apiThreads) {
//     // Join the lists from threads.json together
//     var output = []
//     for (var i = 0; i< apiThreads.length; i++){
//         //
//         var pageThreads = apiThreads[i].threads
//         for (var j = 0; j< pageThreads.length; j++){
//             //
//             var thread = pageThreads[j]
//             output.push(thread)
//         }
//     }
//     return output
// }

function joinApiThreadsListsIds (apiThreads) {
    // Join the lists from threads.json together
    var output = []
    for (var i = 0; i< apiThreads.length; i++){
        //
        var pageThreads = apiThreads[i].threads
        for (var j = 0; j< pageThreads.length; j++){
            //
            var threadId = pageThreads[j].no
            output.push(threadId)
        }
    }
    return output
}

// async function handleMultipleThreadsSequentially (siteURL, boardName, threadIds) {
//     // Iterate over an array of threadIDs
//     // logger.debug('processing threads: ',threadIds)
//     for (var i = 0; i< threadIds.length; i++){
//         var threadId = threadIds[i]
//         await handleWholeThreadAtOnce(siteURL, boardName, threadId)
//     }
//     logger.debug('Finished processing threads.')
//     return
// }

async function handleMultipleThreadsSequentiallyWithMediaAlso (siteURL, boardName, threadIds) {
    // Iterate over an array of threadIDs but also process some media
    // logger.debug('processing threads: ',threadIds)
    for (var i = 0; i< threadIds.length; i++){
        var threadId = threadIds[i]
        await handleWholeThreadAtOnce(siteURL, boardName, threadId)
        // await handleSomeMedia()
    }
    logger.debug('Finished processing threads.')
    return
};


// Functions that check if a post is something
function isPostSticky (postData) {
    //Non-sticky posts will lack 'sticky' key or have it set to false
    // Sticky posts will have post.sticky === 1
    if (postData.sticky) {
        return true
    } else {
        return false
    }
};

function isPostOP(postData,threadId) {
    return (postData.no == threadId)
};

function isPostLocked(postData) {
    return (postData.closed == 1)
};

function isPostSpoiler(postData) {
    return (postData.spoiler == 1)
};

function getPostFilename(postData) {
    if (postData.filename) {
        return `${postData.filename}${postData.ext}`
    } else {
        return null
    }
};

function getPostCapcode(postData) {
    // Return the capcode for a post if it has one, otherwise return 'N'
    if (postData.capcode) {
        return postData.capcode
    } else {
        return 'N'
    }
};

function getPostTripcode(postData) {
    // Return the tripcode for a post if it has one.
    if (postData.trip) {
        return postData.trip
    } else {
        return null
    }
};

function getPostMediaorig(postData) {
    // Return the value for the foolfuuka column 'media_orig'
    if (postData.tim) {
        return `${postData.tim}${postData.ext}`
    } else {
        return null
    }
};

function getPostPrevieworig(postData) {
    // Return the value for the foolfuuka column 'preview_orig'
    if (postData.tim) {
        return `${postData.tim}.jpg`
    } else {
        return null
    }
};
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


function fetchApiJson(url) {
    // Ratelimit API use
    return new Promise( (resolve, reject) => {
        logger.debug('Loading API URL: ', url)
        limiter.removeTokens(1, function() {
            logger.trace('Limiter fired.')
            // rp(url)// Old way that works but dies if any problems
            fetchUrl(url, 0)// New way that is WIP and meant to be resistant to network trouble
            .then( (dataString) => {
            // Decode JSON
            var decoded = JSON.parse(dataString)
            resolve(decoded)
            })
            .catch( (err) => {
                // Log the error and pass it on
                logger.error('Cant load API page!')
                logger.error('err = ', err)
                logger.error('err.code = ', err.code)
                reject(err)
            })
        })
    })
}

function fetchUrl(url, attemptCount) {// WIP
    // Handle netowrk hiccups and still fetch the data
    var retryLimiter = new RateLimiter(1, 5000, true);// numberOfTokens, milliseconds, fireImmediately // Make retries wait
    return new Promise( (resolve, reject) => {
        attemptCount += 1
        if (attemptCount > 0) { logger.debug('Retrying. url = ', url, '; attemptCount = ', attemptCount)}
        if (attemptCount === 5) reject('fetchUrl(): Too many failed retries! url = ', url)
        retryLimiter.removeTokens(1, function() {// Make retries wait
            rp(url)
            .then( (data) => {
                resolve(data)
            })
            .catch( (err) => {
                if (err.name === 'RequestError') {
                    // Handle some known error type
                    logger.error('Handling RequestError by retrying. err = ', err)
                    retryData = fetchUrl(url, attemptCount)// Retry
                    logger.debug('retryData =', retryData)
                    resolve(retryData)
                } // TODO: Handle more error types in better ways
                // Log the error and pass it on
                logger.error(err)
                logger.error('err = ', err)
                logger.error('err.cause.code = ',err.cause.code)
                reject(err)
                // fetchUrl(url, attemptCount)// Retry
            })
        })
    })
}


async function handleWholeThreadAtOnce(siteURL, boardName, threadId) {
    // Load a thread from the API; lookup all its posts at once; insert new posts; update existing posts
    // Generate API URL
    var threadURL = `${siteURL}/${boardName}/thread/${threadId}.json`
    logger.info('processing thread: ',threadURL)
    // Load thread API URL
    return fetchApiJson(threadURL)
    .then( (threadData) => {
        var apiPosts = threadData.posts
        // Process thread data
        // Extract thread-level data from OP
        var opPostData = apiPosts[0]
        var threadId = opPostData.no
        // Lookup threadID in the DB
        return db.Thread.findOne(
            {
            where:  {
                thread_num: threadId,
                }
            },
        )
        .then( (threadRow) => {
            if (threadRow) {
                logger.debug('Thread already in DB: ', threadId)
                return
            } else {
                logger.debug('Creating entry for thread: ', threadId)
                // Create entry for thread
                return db.Thread.create({
                    thread_num: threadId,
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
                    },
                ).then( (threadRow) => {
                    logger.trace('Thread added to DB: ', threadRow)
                })
                .catch( (err) => {
                    logger.error(err)
                })
            }
        })
        .then( () => {
            // Load existing posts from DB
            return db.Post.findAll(
                {
                where:  {
                    thread_num: threadId,
                    }
                },
            )
            .then( (postRows) => {
                logger.trace('postRows', postRows)
                logger.debug('postRows.length ', postRows.length)
                logger.debug('threadData.posts.length ', threadData.posts.length)
                // Compare data for each post in the DB against the API

                // Find posts in DB but not in API (deleted)
                var deletedPostRows = compareFindDeletedPostRows(postRows, apiPosts=threadData.posts)
                logger.debug('deletedPostRows.length ', deletedPostRows.length)
                // Insert posts in DB but not in API (deleted)
                Promise.all(deletedPostRows.map( (postRow) => {
                    var postID = postRow.num
                    if (postRow.deleted === 0) {
                        return markPostDeleted(postID, threadId);
                    }
                }))
                .then( (arrayOfResults) => {
                    logger.trace('np() arrayOfResults', arrayOfResults)

                    // Deal with posts in DB and in API (meh.)
                    // TODO
                    //updatePost(postApiData, postRow, postID, threadId)

                    // Find posts in not DB but in API (new)
                    var newApiPosts = compareFindNewApiPosts(postRows=postRows, apiPosts=threadData.posts)
                    logger.debug('newApiPosts.length ', newApiPosts.length)
                    // logger.debug('newApiPosts ', newApiPosts)
                    // Update posts in not DB but in API (new)
                    Promise.all(newApiPosts.map( (postRow) => {
                        return insertPost(postRow, threadId, boardName);
                    })).then( (arrayOfResults) => {
                        return logger.trace('dp() arrayOfResults ', arrayOfResults)
                    })    
                })
            })
        })
    })
    .then( (result) => {
        logger.debug('result:', result)
    })
    .catch( (err) => {     
        if (err.statusCode === 404) {
            // TODO Mark as expired/removed?
            logger.error('404 for threadURL', threadURL)
            return
        } else {
            logger.error(err)
            throw(err)
        }
    })
}

function updatePost(postApiData, postRow, postID, threadId) {// TODO
    logger.debug('postID, threadId: ', postID, threadId)
    logger.silly('updatePost(): ', postApiData, postRow, postID, threadId)
    // Test if data for a post has changed and if so, deal with updating it.
    
    // Test values to update
    var values = {
    // post deleted?
    deleted: (false),
    time_last_modified: postApiData.last_modified,

    // media deleted?
    //
    }

    // Perform update
    return db.Post.update(values, {
        where: {
            num: postID,
            thread_num: threadId
            }
        },
    )
    .then( (result) => {
        logger.debug('Successfully updated post:', postID, threadId)
        logger.silly('success, result: ', result)
    })
    .catch( (err) => {
        logger.error(err)
    })
}

function markPostDeleted(postID, threadId) {
    // Mark a given post as deleted
    logger.debug('Marking post as deleted: postID, threadId: ', postID, threadId)
    db.Post.update(
        {
            deleted: 1,
        },{
        where: {
            num: postID,
            thread_num: threadId
            }
        },
    ).then( function markPostDeleted_afterUpdate (result) {
        logger.trace('result:', result)
    })
}

function compareFindDeletedPostRows (postRows, apiPosts) {
    // Produce an array of post DB rows  that do not match the 4ch API post objects
    logger.trace('postRows, apiPosts:', postRows, apiPosts)
    var deletedPostRows = []
    for (let i = 0; i< postRows.length-1; i++){
        var dbPost = postRows[i]
        var matched = false
        for (let j = 0; j< apiPosts.length-1; j++){
            var apiPost = apiPosts[j]
            if ( String(dbPost.num) === String(apiPost.no) ) {
                matched = true// If in DB but not API
                break// We can skip the rest of this inner loop if we already know a match occured
            }
        }
        if (matched){
            deletedPostRows.push(dbPost)
        }
    }
    logger.trace(' deletedPostRows', deletedPostRows)
    return deletedPostRows
}

function compareFindNewApiPosts (postRows, apiPosts) {// WIP
    // Produce an array of 4ch API post objects that do not match any item in the given post DB rows
    //logger.debug('postRows, apiPosts:', postRows, apiPosts)
    // Format into object type for sorting
    const postRowsObj = buildObjFromArray(postRows, 'num')
    const apiPostsObj = buildObjFromArray(postRows, 'no')
    // Select items that occur only apiPosts
    var newApiPosts = []
    for (var j = 0; j< apiPosts.length; j++){
        var apiPost = apiPosts[j]
        var isMatch = isitemInobj(postRowsObj, String(apiPost.no))
        if ( ! isMatch ) {
            // Add to output if does not match
            var match = apiPost
            newApiPosts.push(match)
        }
    }
    // logger.debug('newApiPosts:', newApiPosts)
    return newApiPosts
}

function buildObjFromArray (arrayIn, itemKey) {
    var obj = {}
    for (var k = 0; k< arrayIn.length; k++){
        var item = arrayIn[k]
        var itemKeyString = String(item[itemKey])
        obj[itemKeyString] = item
    }
    return obj
}

function isitemInobj(obj, itemName) {
    var inObj = ( itemName in obj )
    return inObj
}

async function insertPost(postData, threadId, boardName) {
    // Insert a post without looking at the DB first
    logger.debug('postData.no', postData.no)
    // logger.debug('Post is not in the DB')
    // If post has a file ?post.md5 !== ''?
    if (postData.md5) {
        logger.debug(`Post ${postData.no} has an image`)
        // Lookup MD5 in DB
        return db.Image.findOne(
            {
                where:{media_hash: postData.media_hash}
            },
        )
        .then( async function insertPost_afterMd5Search (md5SearchRow) {
            logger.trace('insertPost_afterMd5Search() md5SearchRow=', md5SearchRow)
            if (md5SearchRow) {
                logger.debug('Image is already in the DB')
                // If MD5 found, use that as our entry in media table
                var mediaId = md5SearchRow.media_id
                logger.debug('insertPost_afterMd5Search() mediaId=', mediaId)
                return insertPostFinal(postData, threadId, mediaId)
            } else {
                logger.debug(`Image ${postData.md5} is not in the DB`)
                // Download image
                downloadApiPostMedia(postData)
                .then( (mediaId) => {
                    logger.debug(`Image ${postData.md5} has been inserted with media_id ${mediaId}`)
                    return insertPostFinal(postData, threadId, mediaId)
                }) 
            }
        })
    } else {
        logger.debug(`Post ${postData.no} has no image`)
        var mediaId = 0// We don't have media for this post, so use 0
        logger.trace('mediaId: ', mediaId)
        return insertPostFinal (postData, threadId, mediaId)
    }
}

function generateMediaFullFilepath(basePath, boardName, tim, ext) {
    // https://desu-usergeneratedcontent.xyz/desu/image/1532/60/15326055533915.jpg
    // boardName/image/1234/56/123456789.ext
    var tim = tim.toString()
    var subdir_a = tim.slice(0,3)
    var subdir_b = tim.slice(3,4)
    var fullFilePath = `${basePath}${boardName}/image/${subdir_a}/${subdir_b}/${tim}${ext}`
    return fullFilePath
}

function generateMediaThumbFilepath(basePath, boardName, tim) {
    // https://desu-usergeneratedcontent.xyz/desu/thumb/1532/60/15326055533915s.jpg
    // boardName/thumb/1234/56/123456789s.jpg
    var tim = tim.toString()
    var subdir_a = tim.slice(0,3)
    var subdir_b = tim.slice(3,4)
    var fullFilePath = `${basePath}${boardName}/thumb/${subdir_a}/${subdir_b}/${tim}s.jpg`
    return fullFilePath
}

function downloadApiPostMedia(postData) {//WIP
    return new Promise(
        function (resolve, reject) {
        logger.debug('downloadApiPostMedia()')
        // logger.debug('postData:', postData)
        var postId = postData.no
        var md5 = postData.md5
        logger.debug('md5:', md5)
        // Fetch the media files for the post
        // Decide where to save each file
        // Images: http(s)://i.4cdn.org/board/tim.ext
        var fullURL = `https://i.4cdn.org/${global_boardName}/${postData.tim}${postData.ext}`
        var fullFilePath = generateMediaFullFilepath(global_savepath, global_boardName, postData.tim, postData.ext)
        // Thumbnails: http(s)://i.4cdn.org/board/tims.jpg
        var thumbURL = `https://i.4cdn.org/${global_boardName}/${postData.tim}s.jpg`
        var thumbFilePath = generateMediaThumbFilepath(global_savepath, global_boardName, postData.tim)
        // Save full image
        downloadMedia(fullURL, fullFilePath)
        // Save thumb
        downloadMedia(thumbURL, thumbFilePath)
        // TODO: Validate image data (size and md5)
        // Insert row into Images table
        return db.Image.create(
            {
                media_hash: md5,
                media: fullFilePath,// TODO Verify format Asagi uses
                preview_op: null,//'local/path/to/preview_op.ext',// TODO
                preview_reply: thumbFilePath,// TODO Verify format Asagi uses
            },
        )
        .then(function downloadApiPostMedia_afterImageInsert (imageRow) {
            logger.debug('Image added to DB: imageRow.media_id=', imageRow.media_id)
            var mediaId = imageRow.media_id
            resolve(mediaId)
        })
        .catch( function downloadApiPostMedia_ErrorHandler (err) {
            logger.error(err)
            reject(err)
        })
    })
};


function downloadMedia(url, filePath) {
    // Save a target URL to a target path
    logger.trace('before limiter; url, filePath=', url, filePath)
    // logger.warn('Media downloading disabled!')
    // return
    // Ensure destination dir exists
    var destinationDir = path.dirname(filePath)
    fs.ensureDir(destinationDir)
    .then( () =>  {
        // Download and save file to disk
        limiter.removeTokens(1, function() {
            logger.debug('Saving URL=', url, 'to filePath=',filePath)
            // return
            request.get(url)
            .on('error', function(err) {
                logger.error('err', err)
                console.log('downloadMedia() err=',err)
                throw(err)
            })
            .pipe(fs.createWriteStream(filePath))
        })
    })
};



function insertPostFinal (postData, threadId, mediaId) {
    // Insert the post's data
    logger.debug('Inserting post data, postData.no=',postData.no)
    return db.Post.create({
        media_id: mediaId,
        poster_ip: 0,// 0 for scraped posts
        num: postData.no,
        subnum: 0,// 0 for scraped posts
        thread_num: threadId,
        op: isPostOP(postData,threadId),
        timestamp: postData.time,//TODO: Improve validation
        timestamp_expired: 0,// 0 for scraped posts
        preview_orig: getPostPrevieworig(postData),//TODO: collect this value
        preview_w: postData.tn_w,//TODO: Improve validation
        preview_h: postData.tn_h,//TODO: Improve validation
        media_filename: getPostFilename(postData),//TODO: Improve validation
        media_w: postData.w,//TODO: Improve validation
        media_h: postData.h,//TODO: Improve validation
        media_size: postData.fsize,//TODO: Improve validation
        media_hash: postData.md5,//TODO: Improve validation
        media_orig: getPostMediaorig(postData),//TODO: collect this value
        spoiler: isPostSpoiler(postData),
        deleted: (postData.deleted),
        capcode: getPostCapcode(postData),//TODO: collect this value, 'N' as placeholder
        email: null,//TODO: collect this value
        name: postData.name,//TODO: Improve validation
        trip: getPostTripcode(postData),// TODO: collect this value
        title: postData.sub,//TODO: Improve validation
        comment: postData.com,//TODO: Improve validation
        delpass: null,// null for scraped posts
        sticky: isPostSticky(postData),// TODO: collect this value, zero as placeholder
        locked: isPostLocked(postData),// TODO: collect this value, zero as placeholder
        // poster_hash: null,// TODO: Find out if Asagi even collects this
        // poster_country: null,// TODO: Find out if Asagi even collects this
        exif: null,// TODO: Find out if Asagi even collects this
        },
    )
    .then( async function afterPostInsert (postCreatePostResult) {
        logger.trace('postCreatePostResult ',postCreatePostResult)
    })
    // .catch( (err) => {
    //     logger.error(err)
    // })
};