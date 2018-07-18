// request_learn.js
// Learning how to use node-request
const request = require('request')
const fs = require('fs-extra')
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 250);


request
  .get('https://s.gravatar.com/avatar/0f56a5e429de009a27b0ae8f796ef2df?size=100&default=retro')
  .on('error', function(err) {
    console.log(err)
  })
  .pipe(fs.createWriteStream('debug/avatar.png'))