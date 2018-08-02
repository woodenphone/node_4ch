"use strict";
// model.js
// Model of how to record thread data cache and how the 4ch api works

// ========== SEPERATOR ========== SEPERATOR ========== SEPERATOR ==========
// RAM cache values

//TODO
var cacheThread = {// To retain in local RAM to remember when thread was last processed
    id: 0, // Remote thread ID
    lastChecked: 0,//Local timestamp, used for throttling: allowUpdate = (currentTime+delay > lastChecked)
    remoteLastModified: 0,// Remote last updated, watch for changes: updated = (oldValue === newValue)
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
// 4ch threads.json API

//http(s)://a.4cdn.org/board/threads.json
var threadsDotJsonAllInOne = [
    {
        page: 1,
        threads: [
            {
                no: 66974420,// Thread number
                last_modified: 1533181087// Unix time
            }, {
                no: 66954488,
                last_modified: 1533179816
            }, {
                no: 66962493,
                last_modified: 1533188137
            }
        ]
    }, {
        page: 2,
        threads: [
            {
                "no": 66971842,
                "last_modified": 1533179235,
            }, {
                "no": 66973810,
                "last_modified": 1533178366,
            }
        ]
    }
]

var threadsDotJson = [//http(s)://a.4cdn.org/board/threads.json
        threadsDotJsonPage,
        threadsDotJsonPage,
        //... length is however many pages the board has
]

var threadsDotJsonPage = {// http(s)://a.4cdn.org/board/threads.json
    page: null,// integer, starting from 1
    threads: [
        threadsDotJsonThread
    ],//
}

var threadsDotJsonThread = {// http(s)://a.4cdn.org/board/threads.json
    posts: [
        threadsDotJsonPost,
        threadsDotJsonPost,
        threadsDotJsonPost,
        //...
    ]
}

var threadsDotJsonPost = {// http(s)://a.4cdn.org/board/threads.json
    no: null,// integer post ID
    last_modified: null,// integer unix time
}

// ========== SEPERATOR ========== SEPERATOR ========== SEPERATOR ==========
// 4ch catalog.json API

var catalogAllInOne = [
    {
        page: 1,
        threads: [
            {
                no: 66973833,
                //...
                replies: 183,
                //...
                last_replies: [
                    {
                        no: 66978640,
                        //...
                        time: 1533189349
                    }
                ]
            }
        ]
    }
]

var catalog = [
    catalogPage,
    catalogPage,
    //...
]

var catalogPage ={
    page: null,// integer starting at 1
    threads: [
        catalogThread,
        catalogThread,
        catalogThread,
        //...
    ]
}

var catalogThread = {
    no: null,// Thread number
    //... many provided values omittted here for clarity
    last_modified: null,// integer unix time last modified
    replies: null,// integer number of replies. doUpdate = (oldValue === newValue)
    last_replies: [
        {
            no: null,// Post ID
            time: null,// 
            //...
        }
    ]
}

var catalogReply = {
    no: null,// Integer post number
    time: null// Integer unix time
    //... more values are used, but omitted here for clarity
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