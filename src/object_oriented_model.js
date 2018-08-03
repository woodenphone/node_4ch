"use strict";
// object_oriented_model.js


class Board {
    constructor(shortName, longName) {
        this.shortName = shortName
        this.longName = longName
        this.threads = {}
    }
    addThread (thread) {
        if (this.thread[thread.thread_num]) throw('Thread is already in board')
        this.posts[post.num] = thread        
    }

    }
}

class Thread {
    constructor() {
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
        this.lastChecked = null
        this.posts = {}
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
