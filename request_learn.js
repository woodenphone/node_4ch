// request_learn.js
// Learning how to use node-request
const request = require('request')
const jsonFile = require('jsonfile')
const fs = require('fs-extra');
const lupus = require('lupus');
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 10);

var threadData = jsonFile.readFileSync('git_ignored\\test_thread.json');

const boardName = 'g'


downladThreadImages(threadData)


function downladThreadImages(threadData) {
  console.log('downladThreadImages() threadData', threadData)
  for (i in threadData.posts) {
    console.log('threadData.posts[i]', threadData.posts[i])
    limiter.removeTokens(1, () => {
      downloadPostImage(postData)
    })
  }
}




function downloadPostImage(postData) {
  // console.log('downloadPostImage() postData', postData)
  // console.log('postData.filename', postData.filename)
  if (! postData.filename) {
    return
  } else {
    var fullURL = `https://i.4cdn.org/${boardName}/${postData.tim}${postData.ext}`
    var fullFilePath = `debug/${boardName}/${postData.tim}.${postData.ext}`
    downloadMedia(fullURL, fullFilePath)
  }
}


function downloadMedia(url, filepath) {
  console.log('Saving URL: ', url, 'to filepath: ',filepath)
  console.log('DL disabled for debugging')
  return
  request
      .get(url)
      .on('error', function(err) {
          console.log(err)
          raise(err)
      }).pipe(fs.createWriteStream(filepath))
}