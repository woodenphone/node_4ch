"use strict";
// temp_asagi_style_code_storage_file.js
// This is intended to segregate some new experimental code
// to keep other files cleaner and to prevent naming conflicts











// ===== WIP =====
function loopThreadsApi () {// WIP TODO still figuring this out
    // Init persistant stores
    var threadQueue = []
    var postQueue = []
    var mediaToGrabQueue = []
    var mediaPostUpdateQueue = []
    while (true) {

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
        mediaQueue += insertPosts(threadQueue)

        // INSERT media after downloading it, and give back a listing of the successfully donwloaded hashes
        mediaPostUpdateQueue += grabAndInsertMedia(mediaQueue)
        
        // UPDATE media posts WHERE media_hash = NULL to link them to their media
        for media in mediaPostUpdateQueue: "UPDATE posts.media_id WHERE posts.hash = thisHash"
        })
        return 'debug'// TODO REMOVEME Prevent loop during development
    }
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
    // INSERT thread into board.threads table
    return postsList
}

function insertPosts(postsList) {// TODO
    // INSERT/UPDATE posts into the DB, recording what media was associated with them
    return media

function insertPost(post) {// TODO
    // INSERT/UPDATE a post into the DB, recording what media was associated with it
    // Get OP data
    // INSERT post
    return media
}


function handleimages(images) {
    for (var i = 1; i< images.length; i++){
        image = images[i]
        handleImage(image)
    }
    return
}

function handleImage(image) {
    // Check if DL needed
    // Optionally download files
    // UPDATE posts with matching hash
    return
}



// ===== /WIP =====
