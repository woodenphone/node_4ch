"use strict";
// temp_asagi_style_code_storage_file.js
// This is intended to segregate some new experimental code
// to keep other files cleaner and to prevent naming conflicts











// ===== WIP =====
function loopThreadsApi () {// WIP TODO still figuring this out
    // Init persistant stores
    var lastUpdatedcache = []// model.js.cacheThread
    var threadQueue = []
    var postQueue = []
    var mediaToGrabQueue = []
    var mediaPostUpdateQueue = []
    // Begin work
    while (true) {// TODO: Look into more efficient loop mechanisms
        // Load API data
        var threadsUrl = `${siteURL}/${boardName}/threads.json`
        fetchApiJson(threadsUrl)
        .then( (apiThreads) => {

        // Run comparisons to decide what order to process threads in
        // Page 1
        threadQueue.push(apiThreads[0].threads)
        // Last two pages
        threadQueue.push(apiThreads[-1].threads)
        threadQueue.push(apiThreads[-2].threads)
        middleThreads = []// Other pages
        if (threads.length > 3){
            var apiThreadsLengthMinusTwo = apiThreads.length
            for (var i = 1; i< apiThreadsLengthMinusTwo; i++){
                threadQueue.push(apiThreads[i].threads)
            }
        }

        
        
        
        // INSERT/UPDATE threads and download their posts
        postQueue += insertThreads(threadQueue)

        // INSERT/UPDATE posts from queue into the DB, recording what media was associated with them
        mediaToGrabQueue += insertPosts(postQueue)

        // INSERT media after downloading it, and give back a listing of the successfully donwloaded hashes
        mediaPostUpdateQueue += grabAndInsertMedia(mediaToGrabQueue)
        
        // UPDATE media posts WHERE media_hash = NULL to link them to their media
        // for media in mediaPostUpdateQueue: "UPDATE posts.media_id WHERE posts.hash = thisHash"
        mediaPostUpdateQueue = linkPostsToMedia(mediaPostUpdateQueue)
        })

        return 'debug'// TODO REMOVEME Prevent loop during development
    }
}

function decideIfDoUpdate (threadData) {
    // Decide which threads to process based on the time they were lsat uppdated
    return
}

function insertThreads(threadsList) {// TODO
    // INSERT/UPDATE threads and download their posts
    
    var postsList = []
    for (var i = 1; i< threadsList.length; i++){
        var threadNewPosts = insertOneThread(threadsList[i])
        postsList += threadNewPosts
    }
    return postsList
}

function insertOneThread(thread){// TODO
    /// INSERT/UPDATE a thread and download its posts
    // Get OP data
    // If new: INSERT thread into board.threads table
    // If existing and modified: UPDATE thread entry
    return postsList
}

function insertPosts(postsList) {// TODO
    // INSERT/UPDATE posts into the DB, recording what media was associated with them
    for (var i = 1; i< postsList.length; i++){
        post = postsList[i]
        insertPost(post)
    }
    return media

function insertPost(post) {// TODO
    // INSERT/UPDATE a post into the DB, recording what media was associated with it
    // Get OP data
    // INSERT post
    return media
}

function grabAndInsertMedia(images) {
    for (var i = 1; i< images.length; i++){
        image = images[i]
        grabAndInsertSingleMedia(image)
    }
    return
}

function grabAndInsertSingleMedia(image) {
    // Check if DL needed
    // SELECT storedhash FROM board_img WHERE storedhash = remoteHash LIMIT 1
    // Optionally download files
    return
}

function linkPostsToMedia(mediaList) {
    // UPDATE media posts WHERE media_hash = NULL to link them to their media
    // for media in mediaPostUpdateQueue: "UPDATE posts.media_id WHERE posts.hash = thisHash"
    var failedMediaItems = []
    for (var i = 1; i< mediaList.length; i++){
        media = mediaList[i]
        failedItems += linkSinglePostToMedia(media)
    }
    return failedMediaItems
}

function linkSinglePostToMedia(media) {
    // UPDATE media posts WHERE media_hash = NULL to link them to their media
    // for media in mediaPostUpdateQueue: "UPDATE posts.media_id WHERE posts.hash = thisHash"
    return
}

// ===== /WIP =====
