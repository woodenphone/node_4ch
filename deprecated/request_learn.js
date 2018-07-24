// request_learn.js
// Learning how to use node-request
// const request = require('request')
const jsonFile = require('jsonfile')
const request = require('request');// for file streaming
const rp = require('request-promise');// for pages
const rp_errors = require('request-promise/errors');
const fs = require('fs-extra');
const lupus = require('lupus');
var logger = require('tracer').colorConsole();
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 100);


// var threadData = jsonFile.readFileSync('git_ignored\\test_thread.json');

const boardName = 'g'

// posts = threadData.posts
// downladThreadImages(posts)
downloadMedia('https://desu-usergeneratedcontent.xyz/desu/image/1489/11/14891196627333.png', 'debug/14891196627333.png')
downloadMedia('https://i.4cdn.org/g/1531832753934s.png', 'debug/1531832753934s.png')


function downladThreadImages(posts) {
  // console.log('downladThreadImages() posts', posts)
  for (let i = 0; i< posts.length; i++){
    const post = posts[i];
    // console.log('post', post)
    limiter.removeTokens(1, function() {
      downloadPostImage(post)
    })
  }
}

function downloadPostImage(postData) {
  // console.log('downloadPostImage() postData', postData)
  // console.log('postData.filename', postData.filename)
  // Image posts will have a filename
  if (! postData.filename) {
    return
  } else {
    var fullURL = `https://i.4cdn.org/${boardName}/${postData.tim}${postData.ext}`
    var fullFilePath = `debug/${boardName}/${postData.tim}${postData.ext}`
    return downloadMedia(fullURL, fullFilePath)
  }
}

// function downloadMedia(url, filepath, attempt=0) {
//   const maxAttempts = 5
//   attempt += 1
//   logger.debug('Saving URL: ', url, 'to filepath: ',filepath, 'attempt', attempt)
//   // logger.debug('DL disabled for debugging')
//   // return
//   request.get(url, function (error, response, body) {
//     logger.debug('error:', error); // Print the error if one occurred
//     logger.debug('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//     if (error) {
//       // Fail
//       logger.error('downloadMedia() err', err)
//       // raise(error)
//     } else if (response.statusCode == 404) {
//       // Fail
//       logger.error('downloadMedia() bad status code', response.statusCode)
//       // raise('bad statuscode')
//     }
//   }).on('error', function(err) {
//         logger.error('downloadMedia() err', err)
//         console.log('downloadMedia() err ',err)
//         // raise(err)
//     }).pipe(fs.createWriteStream(filepath))
// }

function downloadMedia(url, filepath) {
  logger.debug('Saving URL: ', url, 'to filepath: ',filepath)
  limiter.removeTokens(1, () => {
      logger.trace('Limiter fired.')
      // return
      rp.get(url, (error, response, body) => {
        logger.debug('error:', error); // Print the error if one occurred
        logger.debug('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        if (response.statusCode === 404) {
          // Fail
        }
      })
      .on('error', function(err) {
          logger.error('downloadMedia() err', err)
          console.log('downloadMedia() err ',err)
          raise(err)
      }).pipe(fs.createWriteStream(filepath))
  })
}