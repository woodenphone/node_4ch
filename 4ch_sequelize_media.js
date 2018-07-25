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
const md5File = require('md5-file');
const crypto = require('crypto');
const async = require('async')
var RateLimiter = require('limiter').RateLimiter;
var global_imageLimiter = new RateLimiter(1, 1000);// MUST be above 1000

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
const global_downloadPath = './debug/'// Must be format 'pathHere/'

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
.then(logger.debug('End of program.'))// Inform us that execution has finished
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
        //logger.debug('mediaTodoPostRows:', mediaTodoPostRows)
        logger.debug('mediaTodoPostRows.length: ', mediaTodoPostRows.length)
        // For each unprocessed post, handle the media
        async.map(mediaTodoPostRows, handlePostMedia, function(err, results) {
            logger.info('err=', err ,';results=', results)
            return
        })
        // for (var i = 0; i< mediaTodoPostRows.length; i++){
        //     mediaTodoPostRow = mediaTodoPostRows[i]
        //     await handlePostMedia(mediaTodoPostRow)
        // }
        return
    })
    .then( () => {
        logger.debug('Finished handling this group of media')
        return
    })
    .catch( (err) => {
        logger.error(err)
        throw(err)
    })
}

async function handlePostMedia(postRow) {//WIP
    // See if post even needs media processing by checking if it has post.md5 set
    logger.debug('handlePostMedia()')
    logger.debug('postRow:', postRow)
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
    .then( function decideIfDoDownload (md5ImageSearchRow) {
        if (md5ImageSearchRow) {
            var mediaId = md5ImageSearchRow.media_hash
            logger.debug('Image md5 is already in the DB, skip downloading it.')
            // If MD5 found, use that as our entry in media table
            return updatePostMediaId(postId, threadId, mediaId)
        } else {
            logger.debug('Image md5 is not in the DB, so download it.')
            return downloadPostMedia(postRow, postId, threadId, md5) 
        }
    })
    .catch( (err) => {
        logger.error(err)
        throw(err)
    })
}

function downloadPostMedia (postRow, postId, threadId, md5) {
    // Assumes it is known that this media needs downloading.  
    // Decide where to save each file
    // Images: http(s)://i.4cdn.org/board/tim.ext
    var fullURL = `https://i.4cdn.org/${boardName}/${postRow.tim}${postRow.ext}`
    var fullFilePath = `${global_downloadPath}${boardName}/${postRow.tim}${postRow.ext}`
    // Thumbnails: http(s)://i.4cdn.org/board/tims.jpg
    var thumbURL = `https://i.4cdn.org/${boardName}/${postRow.tim}s.jpg`
    var thumbFilePath = `${global_downloadPath}${boardName}/thumb/${postRow.tim}s.jpg`
    fakePromise = new Promise( (resolve, reject) => { resolve() })// Only here to start the promise chain
    fakePromise
    .then( async function loadMediaUrls () {
        // Fetch the media files for the post
        // Save full image
        //await resilientDownloadMedia(url=fullURL, filepath=fullFilePath, expectedMd5=md5, expectedFileSize=postRow.media_size)
        await downloadMedia(fullURL, fullFilePath)
        // Save thumb
        await downloadMedia(thumbURL, thumbFilePath)
        return
    })
    .then(async function validateFiles () {
        // // TODO Validate files
        // // Ensure files exist
        // // Compare size and MD5
        // var hashesMatch = await checkFileMd5(filepath=fullFilePath, md5b64=md5)
        // logger.debug('hashesMatch=', hashesMatch)
        // var sizesMatch = await checkFileSize(filepath=fullFilePath, expectedFileSize=postRow.media_size)
        // logger.debug('sizesMatch=', sizesMatch)
        return
    })
    .then( async function insertImageRow () {
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
    })
    .then( async function afterImageRowInsert (imageRow) {
        logger.trace('Image added to DB: imageRow=', imageRow)
        var mediaId = imageRow.id
        logger.debug('Image added to DB: mediaId=', mediaId)
        return updatePostMediaId(postId, threadId, mediaId)
    })
    .then( async function afterPostMediaIdUpdate (postUpdateResult) {
    logger.debug('postUpdateResult=', postUpdateResult)
    logger.debug('Proccessed media for postId=', postId)
    })
    .catch( (err) => {
        logger.error(err)
        throw(err)
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
    .catch( (err) => {
        logger.error(err)
        throw(err)
    })
}

async function resilientDownloadMedia(url, filePath, expectedMd5, expectedFileSize, attemptCount=0) {// WIP
    const maxAttempts = 5
    rdlPromise =  new Promise ( (resolve, reject) => {
        logger.debug('resilientDownloadMedia() url=', url, ', filePath =', filePath,', expectedMd5=', expectedMd5, ', expectedFileSize=', expectedFileSize, ', attemptCount=', attemptCount)
        if (attemptCount > maxAttempts) reject('Too many failed download attempts.')
        return downloadMedia(url, filePath)
        .then( () => {
            checkFileSize(filePath, expectedFileSize)
        })
        .then( () => {
            checkFileMd5(filePath, md5B64=expectedMd5)
        })
        .then( () => {
            resolve()
        })
        .catch( (err) => {
            logger.error(err)
            attemptCount += 1
            return resilientDownloadMedia(url, filePath, expectedMd5, expectedFileSize, attemptCount)
        })
    })
    return rdlPromise
}

async function downloadMedia(url, filePath) {
    dlPromise =  new Promise ( (resolve, reject) => {
        // Save a target URL to a target path
        logger.trace('before limiter; url, filePath: ', url, filePath)
        // logger.warn('Media downloading disabled!')
        // return
        global_imageLimiter.removeTokens(1, function() {
            logger.debug('Saving URL: ', url, 'to filePath: ',filePath)
            // return
            request.get(url)
            .on('error', function(err) {
                logger.error('err', err)
                console.log('downloadMedia() err ',err)
                throw(err)
                reject(err)
            })
            .pipe(fs.createWriteStream(filePath))
            .on('finish', () => {
                logger.debug('Successfully saved URL: ', url, 'to filePath: ',filePath)
                resolve(filePath)
            })
        })
    })
    return dlPromise
}

async function checkFileMd5 (filePath, md5B64) {// WIP
    // Return true if md5 of file matches given md5 (given as base64)
    hashCheckPromise =  new Promise ( (resolve, reject) => {
        logger.debug('checkFileMd5 filePath=', filePath, '; md5B64=: ',md5B64)
        var decodedMd5B64 = Buffer.from(md5B64, 'base64').toString('hex')
        var hash_a = crypto.createHash('md5')
        var md5_a
        stream = fs.createReadStream(filePath);
        stream.on('data',async  function (data) {
            hash_a.update(data)
        })
        stream.on('end', function () {
            md5_a = hash_a.digest('hex');
            logger.debug(`decodedMd5B64= ${decodedMd5B64}; md5_a: ${md5_a}`)
            hashes_match = (decodedMd5B64 === md5_a)
            logger.debug(`hashes_match= ${hashes_match}`)
            if (hashes_match) {
                resolve()
            } else {
                reject('Hashes do not match.')
            }
        })
    })
    return hashCheckPromise
}

async function checkFileSize(filePath, expectedFileSize) {// WIP
    // Ensure a file exists, then check if the fil size matches the expected value
    fileSizePromise = new Promise ( (resolve, reject) => {
        fs.exists(filePath, function(exists) {
            if (!(exists) ) {
                reject('File does not exist!', filePath)
            } else {
                fs.stat(filePath, (err, stats) => {
                    if (err) reject(err)
                    actualFileSize = stats.size
                    logger.debug('expectedFileSize=', expectedFileSize, '; actualFileSize=', actualFileSize)
                    if (expectedFileSize === actualFileSize) {
                        resolve(true)
                    } else {
                        reject('Filesize does not match!')
                    }
                })
            }
        })
    })
    return fileSizePromise
}