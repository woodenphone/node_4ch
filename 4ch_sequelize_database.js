// 4ch_sequelize_tables.js
// sequelize DB / table definitions
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
        unique: 'MediaHashUniqueIndex',
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
        unique: 'ThreadNumberUniqueIndex',
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
        unique: 'PostNumberAndThreadNumberUniqueIndex'// This is to ensure that only one entry has a conbination of threadID.PostID
    },
    thread_num: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: 'PostNumberAndThreadNumberUniqueIndex',// This is to ensure that only one entry has a conbination of threadID.PostID
        model: Thread,// Foreign key threads.threadNumber
        key: 'threadNumber',// Foreign key threads.threadNumber
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
    deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
});

exports.Image = Image;
exports.Thread = Thread;
exports.Post = Post;
exports.sequelize = sequelize;