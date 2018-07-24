// 4ch_sequelize_media.js
// Save 4chan media using a DB
// Library imports
const jsonFile = require('jsonfile')
const fs = require('fs-extra');
const lupus = require('lupus');
const Sequelize = require('sequelize');
const rp = require('request-promise')
const rp_errors = require('request-promise/errors');
const request = require('request');// for file streaming
const assert = require('assert');
const md5File = require('md5-file')
var RateLimiter = require('limiter').RateLimiter;
var global_imageLimiter = new RateLimiter(1, 2000);// MUST be above 1000

// Setup logging
const tracer = require('tracer')
var logger = tracer.colorConsole({
	transport : function(data) {
		console.log(data.output);
		fs.appendFile('./debug/4ch_sequelize_media.log', data.rawoutput + '\n', (err) => {
			if (err) throw err;
		});
    },
});
tracer.setLevel('debug')
logger.info('Logging started.')

// Local imports
const db = require('./4ch_sequelize_database.js')// DB schema and setup
  

const global_siteURL = 'https://a.4cdn.org'
const global_boardName = 'g'
const global_downloadPath = './debug/'

// Create tables
// force: true will drop the table if it already exists
db.Post.sync({ force: false }).then(db.Image.sync({ force: false })).then(db.Thread.sync({ force: false }))
// Insert a thread
// .then(handleThreadData(global_testThreadData))
// .then(decideThenInsertPost (postData, threadId, trans, boardName))
// .then(handleThread(global_siteURL, global_boardName, global_threadID))
// .then(handleWholeThreadAtOnce( global_siteURL, global_boardName, global_threadID ) )
// .then(handleMultipleThreadsSequentially(global_siteURL, global_boardName, global_threadIds))
.then(handleAllMedia(siteURL=global_siteURL, boardName=global_boardName, loopLimit=2))
.catch( (err) => {
    logger.error(err)
});



async function handleAllMedia(siteURL, boardName, loopLimit) {
    // Iterate over an array of threadIDs but also process some media
    // logger.debug('processing threads: ',threadIds)
    for (var i = 0; i< loopLimit; i++){
        logger.debug('handleAllMedia() i=', i)
        await handleSomeMedia(siteURL, boardName)
    }
    logger.debug('handleAllMedia() Finished processing threads.')
    return
}

async function handleSomeMedia(siteURL, boardName,) {//WIP
    // SELECT * WHERE media_done = 0 ORDER BY postNumber LIMIT 100
    logger.debug('Handling a group of media...')
    return db.Post.findAll( 
        {
            where:{media_done: false},
            order: [
                ['postNumber', 'ASC'],// Oldest posts first
            ],
            limit: 10
        },
    )
    .then( async function (mediaTodoPostRows) {
        // logger.debug('mediaTodoPostRows:', mediaTodoPostRows)
        logger.debug('mediaTodoPostRows.length: ', mediaTodoPostRows.length)
        // For each unprocessed post, handle the media
        for (var i = 0; i< mediaTodoPostRows.length; i++){
            mediaTodoPostRow = mediaTodoPostRows[i]
            await handlePostMedia(siteURL, boardName, mediaTodoPostRow)
        }
        return
    })
    .then( () => {
        logger.debug('Finished handling this group of media')
        return
    })
    .catch( (err) => {
        logger.error(err)
    })
}

async function handlePostMedia(siteURL, boardName, postRow) {//WIP
    // See if post even needs media processing by checking if it has post.md5 set
    logger.debug('handlePostMedia()')
    // logger.debug('postRow:', postRow)
    var postId = postRow.postNumber
    var threadId = postRow.thread_num
    // Lookup md5 to see if we can skip downloading
    var md5 = postRow.media_hash
    logger.debug('postId:', postId, ';md5:', md5 )
    return db.Image.findOne(
        {
            where:{media_hash: md5}
        },
    )
    .then( async function (md5SearchRow) {
        // logger.debug('md5SearchRow:', md5SearchRow)
        if (md5SearchRow) {
            logger.debug('Image is already in the DB')
            // If MD5 found, use that as our entry in media table
            var mediaId = md5SearchRow.id
            return updatePostMediaId(postId, threadId, mediaId)
        } else {
            // Fetch the media files for the post
            // Decide where to save each file
            // Images: http(s)://i.4cdn.org/board/tim.ext
            var fullURL = `https://i.4cdn.org/${boardName}/${postRow.tim}${postRow.ext}`
            var fullFilePath = `debug/${boardName}/${postRow.tim}${postRow.ext}`
            // Thumbnails: http(s)://i.4cdn.org/board/tims.jpg
            var thumbURL = `https://i.4cdn.org/${boardName}/${postRow.tim}s.jpg`
            var thumbFilePath = `debug/${boardName}/thumb/${postRow.tim}s.jpg`
            // Save full image
            await downloadMedia(fullURL, fullFilePath)
            // Save thumb
            await downloadMedia(thumbURL, thumbFilePath)
            
            // TODO Validate files
            // Compare size and MD5
            // var hashesMatch = await checkFileMd5(filepath=fullFilePath, md5b64=md5)
            // logger.debug('hashesMatch=', hashesMatch)

            // Insert row into Images table
            return db.Image.create(
                {
                    media_hash: md5,
                    media: fullFilePath,// TODO Verify format Asagi uses
                    preview_op: null,//'local/path/to/preview_op.ext',// TODO
                    preview_reply: thumbFilePath,// TODO Verify format Asagi uses
                },
                // {transaction: trans}
            )
            .then( async function (imageRow) {
                logger.trace('Image added to DB: imageRow=', imageRow)
                var mediaId = imageRow.id
                logger.debug('Image added to DB: mediaId=', mediaId)
                return updatePostMediaId(postId, threadId, mediaId)
           })
        }
    })
    .then( () => {
        logger.debug('proccessed postId=', postId)
    })
    .catch( (err) => {
        logger.error(err)
    })
}

async function updatePostMediaId(postId, threadId, mediaId) {
    //
    logger.debug('updatePostMediaId() postId=', postId, 'threadId=', threadId, 'mediaId=', mediaId)
    // Update post record
    return db.Post.update(
        {
            media_id: mediaId,
            media_done: true,
        },
        {where: 
            {
                postNumber: postId,
                thread_num: threadId,
            },
        }
    )
    .then( () => {
        logger.debug('updatePostMediaId() ran insert')
        return
    })
}

async function downloadMedia(url, filepath) {
    dlPromise =  new Promise ( (resolve, reject) => {
        // Save a target URL to a target path
        logger.trace('before limiter; url, filepath: ', url, filepath)
        // logger.warn('Media downloading disabled!')
        // return
        global_imageLimiter.removeTokens(1, function() {
            logger.debug('Saving URL: ', url, 'to filepath: ',filepath)
            // return
            request.get(url)
            .on('error', function(err) {
                logger.error('err', err)
                console.log('downloadMedia() err ',err)
                throw(err)
                reject(err)
            })
            .pipe(fs.createWriteStream(filepath))
            .on('finish', () => {
                logger.debug('Successfully saved URL: ', url, 'to filepath: ',filepath)
                resolve(filepath)
            })
        })
    })
    return dlPromise
}

async function checkFileMd5 (filepath, md5b64) {// TODO
    // Return true if md5 of file matches given md5 (given as base64)
    logger.debug('checkFileMd5 filepath=', filepath, '; md5b64=: ',md5b64)
    md5File(filepath, (err, hash) => {
        if (err) throw(err)
        console.log(`The MD5 sum of ${filepath} is: ${hash}`)
        console.log(`md5b64= ${md5b64}; hash: ${hash}`)
        if (md5b64 === hash) resolve()
        reject()
    })
}
