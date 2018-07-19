// request_learn.js
// Learning how to use node-request
// const request = require('request')
const jsonFile = require('jsonfile')
const request = require('request');// for file streaming
const rp = require('request-promise');// for pages
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
    downloadMedia(fullURL, fullFilePath)
  }
}

function downloadMedia(url, filepath, attempt=0) {
  const maxAttempts = 5
  attempt += 1
  console.log('Saving URL: ', url, 'to filepath: ',filepath)
  // console.log('DL disabled for debugging')
  // return
  
  rp.get(url)
  .on('error', (err) => {
    console.log('downloadMedia() err', err)
    if (attempt < maxAttempts) return downloadMedia(url, filepath, attempt)
  }).then( (data) => {
      // Save data to disk
      fs.writeFile(filepath, data, (err) => {
          if(err) {
              logger.error(err);
              //TODO Retry
          } else {
              // TODO handle success
          }
      })
  })
}

function saveFile(filepath, data) {
  return new Promise( (resolve, reject) {
    h = fs.writeFile(filepath, data, (err) => {
      if(err) {
          logger.error(err);
          //TODO Retry
          reject(err)
      } else {
          // TODO handle success
          resolve(h)
      }
    })
  })
}

