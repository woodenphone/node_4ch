// 4ch_sequelize.js
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



// Define thread columns
const Thread = sequelize.define('thread', {
    threadNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: 'ThreadNumberUniqueIndex'
    },
});

// Define post columns
const Post = sequelize.define('post', {
    postNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    threadNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
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
    timeStamp: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});



// A post for testing
threadID = 66564526
postData = {
    "no":66564526,
    "closed":1,
    "now":"07\/01\/18(Sun)00:45:53",
    "name":"Anonymous",
    "sub":"\/dpt\/ - Daily Programming Thread",
    "com":"old thread: <a href=\"\/g\/thread\/66555693#p66555693\" class=\"quotelink\">&gt;&gt;66555693<\/a><br><br>What are you working on, \/g\/?",
    "filename":"i brought programmer!",
    "ext":".png",
    "w":1280,
    "h":720,
    "tn_w":250,
    "tn_h":140,
    "tim":1530420353413,
    "time":1530420353,
    "md5":"rC2BsoSAoLbE8UiQN8uBjw==",
    "fsize":745037,
    "resto":0,
    "archived":1,
    "bumplimit":1,
    "archived_on":1530484735,
    "imagelimit":0,
    "semantic_url":"dpt-daily-programming-thread",
    "replies":375,
    "images":29,
    "tail_size":50
}

// Insert a post
// force: true will drop the table if it already exists
Post.sync({ force: true }).then(() => {
    // Table created
    return Post.create({
        postNumber: postData.no,
        threadNumber: threadID,
        name: postData.name,
        title: postData.sub,
        comment: postData.com,
        op: (postData.no == threadID),
        timeStamp: postData.tim
    });
});