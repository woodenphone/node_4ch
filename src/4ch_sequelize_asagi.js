// 4ch_sequelize_asagi.js
// Save 4chan threads/posts/media using a DB with the tables Asagi uses
// Library imports
// const jsonFile = require('jsonfile')
const fs = require('fs-extra');
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
  



const global_siteURL = 'https://a.4cdn.org'
const global_boardName = 'g'
const global_savepath = 'debug/'
//const global_threadID = '66770725'





// module.exports.devMain = devMain;
devMain()

function devMain() {
    // Run stuff 
    // Create tables
    // force: true will drop the table if it already exists
    db.Post.sync({ force: false })
    .then(db.Image.sync({ force: false }))
    .then(db.Thread.sync({ force: false }))
    // Insert a thread
    // .then(handleThreadData(global_testThreadData))
    // .then(decideThenInsertPost (postData, threadId, boardName))
    // .then(handleThread(global_siteURL, global_boardName, global_threadID))
    // .then(handleWholeThreadAtOnce( global_siteURL, global_boardName, global_threadID ) )
    // .then(handleMultipleThreadsSequentially(global_siteURL, global_boardName, global_threadIds))
    .then(handleThreads(global_siteURL, global_boardName))
    .catch( (err) => {
        logger.error(err)
    });
}

function handleThreads(siteURL, boardName) {
    // 
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

function joinApiThreadsLists (apiThreads) {
    // Join the lists from threads.json together
    var output = []
    for (var i = 0; i< apiThreads.length; i++){
        //
        var pageThreads = apiThreads[i].threads
        for (var j = 0; j< pageThreads.length; j++){
            //
            var thread = pageThreads[j]
            output.push(thread)
        }
    }
    return output
}

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

async function handleMultipleThreadsSequentially(siteURL, boardName, threadIds) {
    // Iterate over an array of threadIDs
    // logger.debug('processing threads: ',threadIds)
    for (var i = 0; i< threadIds.length; i++){
        var threadId = threadIds[i]
        await handleWholeThreadAtOnce(siteURL, boardName, threadId)
    }
    logger.debug('Finished processing threads.')
    return
}

async function handleMultipleThreadsSequentiallyWithMediaAlso(siteURL, boardName, threadIds) {
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
function isPostSticky(postData) {
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
            rp(url)
            .then( (dataString) => {
            // Decode JSON
            var decoded = JSON.parse(dataString)
            resolve( decoded)
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
        // Process thread data
        // Extract thread-level data from OP
        var opPostData = threadData.posts[0]
        var threadId = opPostData.no
        // Lookup threadID in the DB
        return db.Thread.findOne(
            {
            where:  {
                thread_num: threadId,
                }
            },
        ).then( (threadRow) => {
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
        }).then( () => {
            // Load existing posts from DB
            return db.Post.findAll(
                {
                where:  {
                    thread_num: threadId,
                    }
                },
            ).then( (postRows) => {
                logger.trace('postRows', postRows)
                logger.debug('postRows.length ', postRows.length)
                logger.debug('threadData.posts.length ', threadData.posts.length)
                // Compare data for each post in the DB against the API

                // Find posts in DB but not in API (deleted)
                deletedPostRows = compareFindDeletedPostRows(postRows, apiPosts=threadData.posts)
                logger.debug('deletedPostRows.length ', deletedPostRows.length)
                // Insert posts in DB but not in API (deleted)
                return np = Promise.all(deletedPostRows.map( (postRow) => {
                    var postID = postRow.num
                    if (postRow.deleted === 0) {
                        return markPostDeleted(postID, threadId);
                    }
                })).then( (arrayOfResults) => {
                    logger.trace('np() arrayOfResults', arrayOfResults)

                    // Deal with posts in DB and in API (meh.)
                    // TODO
                    //updatePost(postApiData, postRow, postID, threadId)

                    // Find posts in not DB but in API (new)
                    var newApiPosts = compareFindNewApiPosts(postRows=postRows, apiPosts=threadData.posts)
                    logger.debug('newApiPosts.length ', newApiPosts.length)
                    // logger.debug('newApiPosts ', newApiPosts)
                    // Update posts in not DB but in API (new)
                    return dp = Promise.all(newApiPosts.map( (postRow) => {
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
    deleted: (false)
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

// function compareFindNewApiPosts (postRows, apiPosts) {
//     // Produce an array of 4ch API post objects that do not match any item in the given post DB rows
//     logger.trace('postRows, apiPosts:', postRows, apiPosts)
//     var newApiPosts = []
//     for (let i = 0; i< apiPosts.length-1; i++){
//         var apiPost = apiPosts[i]
//         var matched = false
//         for (let j = 0; j< postRows.length-1; j++){
//             dbPost = postRows[j]
//             if (dbPost.postNumber == apiPost.no) {
//                 matched = true// If in API but not DB
//             }
//         }
//         if (matched){
//             newApiPosts.push(apiPost)
//         }
//     }
//     logger.trace('newApiPosts:', newApiPosts)
//     return newApiPosts
// }


function compareFindNewApiPosts (postRows, apiPosts) {// WIP
    // Produce an array of 4ch API post objects that do not match any item in the given post DB rows
    //logger.debug('postRows, apiPosts:', postRows, apiPosts)
    // Format into object type for sorting
    const postRowsObj = buildObjFromArray (arrayIn=postRows, itemKey='num')
    const apiPostsObj = buildObjFromArray (arrayIn=postRows, itemKey='no')
    // Select items that occur only apiPosts
    var newApiPosts = []
    for (var j = 0; j< apiPosts.length; j++){
        var apiPost = apiPosts[j]
        var isMatch = isitemInobj(obj=postRowsObj, itemName=String(apiPost.no))
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





// function handleThread(siteURL, boardName, threadId) {
//     // Load a thread from the API; then lookup and insert it, its posts, and its media
//     // Generate API URL
//     var threadURL = `${siteURL}/${boardName}/thread/${threadId}.json`
//     logger.info('handleThread() processing thread: ',threadURL)
//     // Load thread API URL
//     rp(threadURL)
//     .then( (htmlString) => {
//         // Decode JSON
//         threadData = JSON.parse(htmlString)
//         // Process thread data
//         return handleThreadData (threadData)
//     })
//     .catch( (err) => {
//         logger.error(err)
//     })    
// }

// function handleThreadData (threadData) {
//     // Check if thread has entry in the db; if not make one; then lookup and insert its posts and media.
//     return db.sequelize.transaction( (trans) => {
//         // Extract thread-level data from OP
//         var opPostData = threadData.posts[0]
//         var threadId = opPostData.no
//         // Lookup threadId in the DB
//         return db.Thread.findOne(
//             {
//             where:  {
//                 threadNumber: threadId,
//                 }
//             },
//             {transaction: trans}
//         ).then( (threadRow) => {
//             if (threadRow) {
//                 logger.debug('Thread already in DB: ', threadId)
//                 // TODO Update thread entry
//             } else {
//                 logger.debug('Creating entry for thread: ', threadId)
//                 // Create entry for thread
//                 return db.Thread.create({
//                     threadNumber: threadId,
//                     time_op: opPostData.time,//TODO
//                     time_last: getThreadTimeLast(threadData),//TODO
//                     time_bump: getThreadTimeLastBumped(threadData),//TODO find better way of calculating this value
//                     time_ghost: null,//TODO
//                     time_ghost_bump: null,//TODO
//                     time_last_modified: getThreadTimeLastModified(threadData),//TODO Should be calculating by inspecting every post, and updating db to highest only if the highest is greater than the DB
//                     nreplies: opPostData.replies,//TODO We should actually count the entries in the DB
//                     nimages: opPostData.images,//TODO We should actually count the entries in the DB
//                     sticky: isPostSticky(opPostData),
//                     locked: isPostLocked(opPostData),
//                 },
//                 {transaction: trans}
//                 ).then( (threadRow) => {
//                     logger.trace('Thread added to DB: ', threadRow)
//                 })
//                 .catch( (err) => {
//                     logger.error(err)
//                 })
//             }
//         }).then( () => {
//             return iterateThreadPosts(threadData, threadId, trans, boardName)
//         })
//         .catch( (err) => {
//             logger.error(err)
//         })
//     })
//     .then( (result) => {
//         logger.debug('Transaction finished: ', threadId, result)
//     })
//     .catch( (err) =>{
//         logger.error(err)
//     })
// }

// function iterateThreadPosts(threadData, threadId, trans, boardName) {
//     // Check the DB for posts and insert them and their media if absent
//     logger.trace('Iterating over test thread:',threadData)
//     lupus(0, threadData.posts.length, (n) => {
//         logger.trace('processing post index:', n)
//         var postData = threadData.posts[n]
//         decideThenInsertPost(postData, threadId, trans, boardName)
//     }, () => {
//         logger.trace('finished lupus loop')
//     })
// }

// function decideThenInsertPost (postData, threadId, trans, boardName) {
//     // Check the DB for a post and insert it and its media if absent
//     logger.debug('decideThenInsertPost() postData.no:', postData.no)
//     // Does post exist in DB?
//     return db.Post.findOne(
//         {
//         where:  {
//             postNumber: postData.no,
//             thread_num: threadId,
//         }
//         },
//         {transaction: trans}
//     ).then( (existingVersionOfPost) => {
//         logger.trace('existingVersionOfPost', existingVersionOfPost)
//         if (existingVersionOfPost) {
//             logger.debug(`Post ${existingVersionOfPost.postNumber} is already in the DB`)
//         } else {
//             logger.debug('Post is not in the DB')
//             return insertPost(postData, threadId, trans, boardName)
//         }
//     })
//     .catch( (err) => {
//         logger.error(err)
//     })
// }

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
    tim = tim.toString()
    subdir_a = tim.slice(0,3)
    subdir_b = tim.slice(3,4)
    var fullFilePath = `${basePath}${boardName}/image/${subdir_a}/${subdir_b}/${tim}${ext}`
    return fullFilePath
}

function generateMediaThumbFilepath(basePath, boardName, tim) {
    // https://desu-usergeneratedcontent.xyz/desu/thumb/1532/60/15326055533915s.jpg
    // boardName/thumb/1234/56/123456789s.jpg
    tim = tim.toString()
    subdir_a = tim.slice(0,3)
    subdir_b = tim.slice(3,4)
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
        var fullFilePath = generateMediaFullFilepath(basePath=global_savepath, boardName=global_boardName, tim=postData.tim, ext=postData.ext)
        // Thumbnails: http(s)://i.4cdn.org/board/tims.jpg
        var thumbURL = `https://i.4cdn.org/${global_boardName}/${postData.tim}s.jpg`
        var thumbFilePath = generateMediaThumbFilepath(basePath=global_savepath, boardName=global_boardName, tim=postData.tim)
        // Save full image
        downloadMedia(fullURL, fullFilePath)
        // Save thumb
        downloadMedia(thumbURL, thumbFilePath)
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
            throw(err)
            reject(err)
        })
    })
};


async function downloadMedia(url, filepath) {
    // Save a target URL to a target path
    logger.trace('before limiter; url, filepath: ', url, filepath)
    logger.warn('Media downloading disabled!')
    return
    limiter.removeTokens(1, function() {
        logger.debug('Saving URL: ', url, 'to filepath: ',filepath)
        // return
        request.get(url)
        .on('error', function(err) {
            logger.error('err', err)
            console.log('downloadMedia() err ',err)
            throw(err)
        })
        .pipe(fs.createWriteStream(filepath))
    })
    return
};



function insertPostFinal (postData, threadId, mediaId) {
    // Insert the post's data
    logger.debug('Inserting post data postData.no=',postData.no)
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