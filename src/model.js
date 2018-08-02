"use strict";
// model.js
// Model of how to record thread data cache and how the 4ch api works

// ========== SEPERATOR ========== SEPERATOR ========== SEPERATOR ==========
// RAM cache values

//TODO
var thread = {// To retain in local RAM to remember when thread was last processed
    id: 0, // Remote thread ID
    lastChecked: 0,//Local timestamp
    remoteLastModified: 0,// Remote last updated
    posts: [
        {
            no:0,// Remote post number
            time:0,// Remote last modified value
        },
    ]
}

//TODO
var insertedPost = {// To retain in local RAM to remember when post was last processed
    id: 0,// Remote thread ID
    lastChecked: 0,//Local timestamp
    remoteLastModified: 0,// Remote last updated
}


// ========== SEPERATOR ========== SEPERATOR ========== SEPERATOR ==========
// 4ch API

//TODO
var threadsDotJsonPage = {// http(s)://a.4cdn.org/board/threads.json
    VALUE: null,//
    VALUE: null,//
}

//TODO
var threadsDotJsonThread = {// http(s)://a.4cdn.org/board/thread/threadnumber.json
    posts: [
        fromApiPost,
        fromApiPost,
        fromApiPost,
        //...
    ]
}

//TODO
var fromApiPost = {
    VALUE: null,//
    VALUE: null,//
    VALUE: null,//
    VALUE: null,//
    VALUE: null,//
    VALUE: null,//
    VALUE: null,//
    VALUE: null,//
    VALUE: null,//
}


// ========== SEPERATOR ========== SEPERATOR ========== SEPERATOR ==========
// Local Asagi-style DB stuff

var toInsertDbPost = {// Represents a row in our board posts table
    media_id: null,// Foreign key to board media table
    poster_ip: null,// 0 for scraped posts
    num: null,// Post ID
    subnum: null,//  0 for scraped posts
    thread_num: null,// Thread OP post ID
    op: null,// Is this the OP
    timestamp: null,//
    timestamp_expired: null,// 0 for scraped posts
    preview_orig: null,//
    preview_w: null,//
    preview_h: null,//
    media_filename: null,//
    media_w: null,//
    media_h: null,//
    media_size: null,//
    media_hash: null,//
    media_orig: null,//
    spoiler: null,//
    deleted: null,//
    capcode: null,//
    email: null,//
    name: null,//
    trip: null,//
    title: null,//
    comment: null,//
    delpass: null,// null for scraped posts
    sticky: null,//
    locked: null,//
    poster_hash: null,//
    poster_country: null,//
    exif: null,//
}
//