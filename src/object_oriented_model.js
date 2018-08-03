"use strict";
// object_oriented_model.js

// Represent data we pulled from the API
class Board {
    constructor(shortName, longName) {
        this.shortName = shortName
        this.longName = longName
        this.cachedThreads = {}
        this.lastBoardUpdateTime = 0
    }
    check () {
        // Compare timestamps
        allowUpdate = (this.lastThreadUpdateTime + threadWaitTime > now())
        if (allowUpdate) {
            this.update()
        }
    }
    update () {
        // Load API JSON and decode
        // Add new threads if any are found
        // Perform check on all threads
    }
    addThread (thread) {
        if (this.cachedThreads[thread].thread_num) {
            throw('Thread is already in board')
        }
        this.cachedThreads[post.num] = thread        
    }

    }
}

class Thread {
    constructor(thread_num) {
        // Run SELECT * WHERE threads.thread_num = thread_num
        this.thread_num
        this.time_op
        this.time_last
        this.time_bump
        this.time_ghost
        this.time_ghost_bump
        this.time_last_modified
        this.sticky
        this.locked
        // local values
        this.lastThreadUpdateTime = 0
        this.cachedPosts = {}
    }
    check () {
        // Compare timestamps
        oldEnough = this.lastThreadUpdateTime + threadWaitTime > now()
        if (oldEnough) {
            this.update()
        }
        else {
            return
        }
    }
    update () {
        // Load API JSON and decode to object
        // 
        this.lastUpdateTime = now()
    }
    addPost (post) {
        if (this.posts[post.num]) throw('Post already in thread')
        this.posts[post.num] = post
    }
    countPosts () {
        return this.posts.length
    }
}

class Post {
    constructor() {
        // Values set by our code
        this.lastSeen = 0
        // Values from API
        this.media_id
        this.num
        this.thread_num
        this.timestamp
        this.op
        this.name
        this.trip
        this.title
    }

}

class media {
    constructor () {
        this.id// Primary key
        this.hash//MD5B64
        this.media// Filepath
        this.preview_op
        this.preview_reply// thumbnail filepath
    }
}

// Represent RAM cache

class CacheBoard {
    constructor (shortName) {
        this.shortname = shortName
        this.threads = {}
    }
    update () {
        // Load threads API and decode to object
        // Run comparisons for each thread
    }
}

class CacheThread {
    constructor(ApiThread) {
        opPost = ApiThread.posts[0]
        this.thread_num = opPost.no
        this.time_bump
        this.time_last_modified
        this.posts = {}
    }
    update () {
        // Load API and decode to object
        // Run comparison/UPDATE for each post
        // Run comparisons and UPDATE for the thread
    }
}

class CachePost {
    constructor (num) {
        this.num = num
        this.timestamp
        this.lastSeen
    }
    update (post) {
    }
}