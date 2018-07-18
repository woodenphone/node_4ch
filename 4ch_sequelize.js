// 4ch_sequelize.js
// Save 4chan threads/posts/media using a DB
const jsonFile = require('jsonfile')
const fs = require('fs');
const lupus = require('lupus');
const Sequelize = require('sequelize');

// Connect to the DB
const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
  
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
  
    // SQLite only
    storage: 'junk_sequelize.sqlite',
  
    // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
    operatorsAliases: false
  });

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });


// Define media columns
const Image = sequelize.define('image', {
    // media_id: {
    //     type: Sequelize.INTEGER,
    //     allowNull: false,
    //     autoIncrement: true,
    //     unique: 'media_id_Unique_Index'
    // },
    media_hash: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    media: {
        type: Sequelize.TEXT
    },
    preview_op: {
        type: Sequelize.TEXT
    },
    preview_reply: {
        type: Sequelize.TEXT
    },
    total: {
        type: Sequelize.INTEGER,
        //allowNull: false,
    },
    banned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
});

// Define thread columns
const Thread = sequelize.define('thread', {
    threadNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: 'ThreadNumberUniqueIndex'
    },
    time_op: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    time_last: {
        type: Sequelize.INTEGER,
        //allowNull: false,
    },
    time_bump: {
        type: Sequelize.INTEGER,
        //allowNull: false,
    },
    time_ghost: {
        type: Sequelize.INTEGER,
        //allowNull: false,
    },
    time_ghost_bump: {
        type: Sequelize.INTEGER,
        //allowNull: false,
    },
    time_last_modified: {
        type: Sequelize.INTEGER,
        //allowNull: false,
    },
    nreplies: {
        type: Sequelize.INTEGER,
        //allowNull: false,
        defaultValue: 0,
    },
    nimages: {
        type: Sequelize.INTEGER,
        //allowNull: false,
        defaultValue: 0,
    },
    sticky: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    locked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
});

// Define post columns
const Post = sequelize.define('post', {
    postNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    thread_num: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // model: Thread,// Foreign key
        // key: 'threadNumber'// Foreign key
    },
    name: {
        type: Sequelize.TEXT
    },
    trip: {
        type: Sequelize.TEXT
    },
    title: {
        type: Sequelize.TEXT
    },
    comment: {
        type: Sequelize.TEXT
    },
    op: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    timestamp: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    timestamp_expired: {
        type: Sequelize.INTEGER,
    },
    media_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        model: Image,// Foreign key
        key: 'id'// Foreign key
    },
    spoiler: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    preview_orig: {
        type: Sequelize.TEXT
    },
    preview_w: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    preview_h: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    media_filename: {
        type: Sequelize.TEXT
    },
    media_w: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    media_h: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    media_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    media_hash: {
        type: Sequelize.TEXT
    },
    media_orig: {
        type: Sequelize.TEXT
    },
});




var threadData = jsonFile.readFileSync('git_ignored\\test_thread.json');

console.log('threadData', threadData)

var threadID = threadData.posts[0].no// TODO Find safer way to generate threadID
var postData = threadData.posts[0]
console.log('postData', postData)



// // A post for testing
// threadID = 66564526
// postData = {
//     "no":66564526,
//     "closed":1,
//     "now":"07\/01\/18(Sun)00:45:53",
//     "name":"Anonymous",
//     "sub":"\/dpt\/ - Daily Programming Thread",
//     "com":"old thread: <a href=\"\/g\/thread\/66555693#p66555693\" class=\"quotelink\">&gt;&gt;66555693<\/a><br><br>What are you working on, \/g\/?",
//     "filename":"i brought programmer!",
//     "ext":".png",
//     "w":1280,
//     "h":720,
//     "tn_w":250,
//     "tn_h":140,
//     "tim":1530420353413,
//     "time":1530420353,
//     "md5":"rC2BsoSAoLbE8UiQN8uBjw==",
//     "fsize":745037,
//     "resto":0,
//     "archived":1,
//     "bumplimit":1,
//     "archived_on":1530484735,
//     "imagelimit":0,
//     "semantic_url":"dpt-daily-programming-thread",
//     "replies":375,
//     "images":29,
//     "tail_size":50
// }




// Create tables
// force: true will drop the table if it already exists
Post.sync({ force: false }).then(Image.sync({ force: false })).then(Thread.sync({ force: false }))
// Insert a thread
.then(handleThread(threadData));




// Functions that check if a post is something
function isPostSticky(postData) {
    //Non-sticky posts will lack 'sticky' key or have it set to false
    // Sticky posts will have post.sticky === 1
    return (postData.sticky == 1)
}

function isPostOP(postData,threadID){
    return (postData.no == threadID)
}

function isPostLocked(postData) {
    return (postData.closed == 1)
}

function isPostSpoiler(postData) {
    return (postData.spoiler == 1)
}
// /Functions that check if a post is something




function handleThread (threadData) {
    // Extract thread-level data from OP
    var opPostData = threadData.posts[0]
    var threadID = opPostData.no
    // Lookup threadID in the DB
    return Thread.findOne({
        where:  {
            threadNumber: threadID,
        }
    }).then( (threadRow) => {
        if (threadRow) {
            console.log('Thread already in DB: ', threadID)
        } else {
            console.log('Creating entry for thread: ', threadID)
            // Create entry for thread
            Thread.create({
                threadNumber: threadID,
                time_op: opPostData.time,//TODO
                time_last: null,//TODO
                time_bump: threadData[-1].time,//TODO find better way of calculating this value
                time_ghost: null,//TODO
                time_ghost_bump: null,//TODO
                time_last_modified: threadData[-1].time,//TODO Should be calculating by inspecting every post, and updating db to highest only if the highest is greater than the DB
                nreplies: opPostData.replies,//TODO We should actually count the entries in the DB
                nimages: opPostData.images,//TODO We should actually count the entries in the DB
                sticky: isPostSticky(opPostData),
                locked: isPostLocked(opPostData),
            }).then( (threadRow) => {
                console.log('Thread added to DB: ', threadRow)
            })
        }
    }).then( () => {
        handlePosts()
    })
}

function handlePosts() {
    console.log('Iterating over test thread:',threadData)
    lupus(0, threadData.posts.length, (n) => {
        console.log('processing post index:', n)
        handlePost(threadData.posts[n])
    }, () => {
        console.log('finished lupus loop')
    })
}

function handlePost (postData) {
    console.log('handlePost() postData.no:', postData.no)
    // Does post exist in DB?
    Post.findOne({
        where:  {
            postNumber: postData.no,
            thread_num: threadID,
        }
    }).then( (existingVersionOfPost) => {
        console.log('postTest existingVersionOfPost', existingVersionOfPost)
        if (existingVersionOfPost) {
            console.log('Post is already in the DB')
        } else {
            console.log('Post is not in the DB')
            // If post has a file ?post.md5 !== ''?
            if (postData.md5) {
                console.log('Post has an image')
                // Lookup MD5 in DB
                Image.findOne({
                    where:{media_hash: postData.md5}
                }).then( (existingVersionOfImageRow) => {
                    console.log('imgTest existingVersionOfImageRow', existingVersionOfImageRow)
                    if (existingVersionOfImageRow) {
                        console.log('Image is already in the DB')
                        // If MD5 found, use that as our entry in media table
                        mediaID = imageRow.id
                        console.log('mediaID: ', mediaID)
                        insertPostFinal(postData, threadID, mediaID)
                    } else {
                        console.log('Image is not in the DB')
                        // If no MD5 found, create new entry in media table and use that
                        // Fetch the media files

                        Image.create({
                            media_hash: postData.md5,
                            media: 'local/path/to/media.ext',// TODO
                            preview_op: 'local/path/to/preview_op.ext',// TODO
                            preview_reply: 'local/path/to/preview_reply.ext',// TODO
                        }).then( (imageRow) => {
                            console.log('Image added to DB: ', imageRow)
                            mediaID = imageRow.id
                            console.log('mediaID: ', mediaID)
                            insertPostFinal(postData, threadID, mediaID)
                        })
                    }
                })
            } else {
                console.log('Post has no image')
                mediaID = null// We don't have media for this post, so use null
                console.log('mediaID: ', mediaID)
                insertPostFinal (postData, threadID, mediaID)
            }
        }
    })
}

function fetchPostMedia(boardName, postData) {
    // Fetch the media files for the post
    // Decide where to save each file
    var fullURL = `https://i.4cdn.org/${boardName}/${postdata.tim}.${postdata.ext}`
    var fullFilePath = `debug/${boardName}/${postdata.tim}.${postdata.ext}`
    var thumbURL = `https://i.4cdn.org/${boardName}/${postData.tim}s.jpg`
    var thumbFilePath = `debug/${boardName}/${postdata.tim}.${postdata.ext}`
    // Save full image
    downloadMedia(fullURL, fullFilePath)
    // Save thumb
    downloadMedia(thumbURL, filepath)

}

function downloadMedia(url, filepath) {
    console.log('Saving URL: ', url, 'to filepath: ',filepath)
    request
        .get(url)
        .on('error', function(err) {
            console.log(err)
            raise(err)
        }).pipe(fs.createWriteStream(filepath))
}

function insertPostFinal (postData, threadID, mediaID) {
    // Insert the post's data
    console.log('Inserting post data')
    return Post.create({
        postNumber: postData.no,
        thread_num: threadID,
        name: postData.name,
        title: postData.sub,
        comment: postData.com,
        op: isPostOP(postData,threadID),
        timestamp: postData.time,
        media_id: mediaID,
        spoiler: isPostSpoiler(postData),
    }).then( (postCreatePostResult) =>{
        // console.log('postCreatePostResult ',postCreatePostResult)
        return
    })
}

// Insert a post with media
// function insertPostWithMedia(post, threadID) {
    
// Given post, threadID
// Have we already saved this post?
// existing_p = Post.findOne({
//     where: {
//         postNumber:postData.no,
//         thread_num: threadID,
// }})
// console.log(existing_p)

// If MD5 found, use that as our entry in media table
// If no MD5 found, create new entry in media table and use that

    // return sequelize.transaction(function (t) {
    //     // chain all your queries here. make sure you return them.
    //     return User.create({
    //       firstName: 'Abraham',
    //       lastName: 'Lincoln'
    //     }, {transaction: t}).then(function (user) {
    //       return user.setShooter({
    //         firstName: 'John',
    //         lastName: 'Boothe'
    //       }, {transaction: t});
    //     });
      
    //   }).then(function (result) {
    //     // Transaction has been committed
    //     // result is whatever the result of the promise chain returned to the transaction callback
    //     console.log('transaction succeeded', result)
    //   }).catch(function (err) {
    //     // Transaction has been rolled back
    //     // err is whatever rejected the promise chain returned to the transaction callback
    //     console.log('transaction failed', err)
    //   });

