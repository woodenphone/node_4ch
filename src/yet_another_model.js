"use strict";
// yet_another_model.js
// Another attempt at writing objects for a memory cache


class Thread {
    constructor (thread_num, lastGrabbed) {
        //
        this.thread_num = thread_num
        this.lastGrabbed = lastGrabbed
        this.posts = []
    }
};

class Post {
    constructor (num) {
        this.num = num
    }
};