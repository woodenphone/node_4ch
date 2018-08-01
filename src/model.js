"use strict";
// Model of how to record thread data cache and how the 4ch api works


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

var insertedPost = {// To retain in local RAM to remember when post was last processed
    id: 0,// Remote thread ID
    lastChecked: 0,//Local timestamp
    remoteLastModified: 0,// Remote last updated
}


// 4ch API
var threadsDotJsonPage = {// http(s)://a.4cdn.org/board/threads.json
    VALUE: null,//
    VALUE: null,//
}

var threadsDotJsonThread = {// http(s)://a.4cdn.org/board/thread/threadnumber.json
    posts: [
        fromApiPost,
        fromApiPost,
        fromApiPost,
        //...
    ]
}

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



var toInsertDbPost = {// Represents a row in our posts table
    num: null,// Post ID
    subnum: null,// N/A
    thread_num: null,// Thread OP post ID
    op: null,// Is this the OP
    timestamp: null,//
    timestamp_expired: null,//
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
    delpass: null,//
    sticky: null,//
    locked: null,//
    poster_hash: null,//
    poster_country: null,//
    exif: null,//
}
//