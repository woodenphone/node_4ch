// sequelize_asagi_tables.js
// sequelize definitions for the tables and columns Asagi uses.
// For information on datatypes sequelize uses, see: http://docs.sequelizejs.com/variable/index.html#static-variable-DataTypes
// Definitions are based on Asagi ones: https://github.com/desuarchive/asagi/blob/master/src/main/resources/net/easymodo/asagi/sql/Mysql/boards.sql
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
    storage: 'junk_asagi_sequelize.sqlite',

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


const global_boardName = 'g'// Temporary placeholder



//CREATE TABLE IF NOT EXISTS "%%BOARD%%" (
const Post = sequelize.define(`${global_boardName}`,
{// Column definitions
    doc_id: {// "doc_id" int unsigned NOT NULL auto_increment,
        type: Sequelize.INTEGER,
        primaryKey: true,// primary key
        autoIncrement: true,
        allowNull: false,
        unique: 'BoardNameUniqueIndex',
    },
    media_id: {// "media_id" int unsigned NOT NULL DEFAULT '0',
        type: Sequelize.TEXT,// Foreign key to images table
        allowNull: false,
        defaultValue: 0,
    },
    poster_ip: {// "poster_ip" decimal(39,0) unsigned NOT NULL DEFAULT '0',
        type: Sequelize.DECIMAL(39,0),
        allowNull: false,
        defaultValue: 0,
    },
    num: {// "num" int unsigned NOT NULL,
        type: Sequelize.INTEGER,// Post ID / Post number
        allowNull: false,
        unique: 'num_subnum_index',// UNIQUE num_subnum_index ("num", "subnum"),
    },
    subnum: {// "subnum" int unsigned NOT NULL,
        type: Sequelize.INTEGER,// Appears to be used internally by Foolfuuka for ghost posts. Looks like scraped posts always have a value of 0 here
        allowNull: false,
        unique: 'num_subnum_index',// UNIQUE num_subnum_index ("num", "subnum"),
    },
    thread_num: {// "thread_num" int unsigned NOT NULL DEFAULT '0',
        type: Sequelize.INTEGER,// Thread ID, also post ID number of OP of the thread
        allowNull: false,
        defaultValue: false,
    },
    op: {// "op" bool NOT NULL DEFAULT '0',
        type: Sequelize.BOOLEAN,// Is this the OP of the thread?
        allowNull: false,
        defaultValue: false,
    },
    timestamp: {// "timestamp" int unsigned NOT NULL,
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    timestamp_expired: {// "timestamp_expired" int unsigned NOT NULL,
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    preview_orig: {// "preview_orig" varchar(20),
        type: Sequelize.STRING(20),
        defaultValue: null,
    },
    preview_w: {// "preview_w" smallint unsigned NOT NULL DEFAULT '0',
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
    preview_h: {// "preview_h" smallint unsigned NOT NULL DEFAULT '0',
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
    media_filename: {// "media_filename" text,
        type: Sequelize.TEXT,
    },
    media_w: {// "media_w" smallint unsigned NOT NULL DEFAULT '0',
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
    media_h: {// "media_h" smallint unsigned NOT NULL DEFAULT '0',
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
    media_size: {// "media_size" int unsigned NOT NULL DEFAULT '0',
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    media_hash: {// "media_hash" varchar(25),
        type: Sequelize.STRING(25),// MD5 hash encoded into base 64
        defaultValue: null,
    },
    media_orig: {// "media_orig" varchar(20),
        type: Sequelize.STRING(20),
        defaultValue: null,
    },
    spoiler: {// "spoiler" bool NOT NULL DEFAULT '0',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    deleted: {// "deleted" bool NOT NULL DEFAULT '0',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    capcode: {// "capcode" varchar(1) NOT NULL DEFAULT 'N',
        type: Sequelize.STRING(1),// TODO: Impliment
        allowNull: false,
        defaultValue: 'N',
    },
    email: {// "email" varchar(100),
        type: Sequelize.STRING(100),
        defaultValue: null,
    },
    name: {// "name" varchar(100),
        type: Sequelize.STRING(100),
        defaultValue: null,
    },
    trip: {// "trip" varchar(25),
        type: Sequelize.STRING(25),
        defaultValue: null,
    },
    title: {// "title" varchar(100),
        type: Sequelize.STRING(100),
        defaultValue: false,
    },
    comment: {// "comment" text,
        type: Sequelize.TEXT,
    },
    delpass: {// "delpass" tinytext,
        type: Sequelize.TEXT('tiny'),
    },
    sticky: {// "sticky" bool NOT NULL DEFAULT '0',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    locked: {// "locked" bool NOT NULL DEFAULT '0',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    poster_hash: {// "poster_hash" varchar(8),
        type: Sequelize.STRING(8),// TODO: Unknown function
    },
    poster_country: {// "poster_country" varchar(2),
        type: Sequelize.STRING(2),// TODO: Unknown function
    },
    exif: {// "exif" text,
        type: Sequelize.TEXT,// TODO: Unknown function
    },
},
{// Table options
    freezeTableName: true
}
);


//CREATE TABLE IF NOT EXISTS "%%BOARD%%_threads" (    
const Thread = sequelize.define(`${global_boardName}_threads`,
{// Column definitions
    thread_num: {// "thread_num" int unsigned NOT NULL,
        type: Sequelize.INTEGER,
        primaryKey: true,// primary key
        autoIncrement: true,
        allowNull: false,
    },
    time_op: {// "time_op" int unsigned NOT NULL,
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    time_last: {// "time_last" int unsigned NOT NULL,
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    time_bump: {// "time_bump" int unsigned NOT NULL,
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    time_ghost: {// "time_ghost" int unsigned DEFAULT NULL,
        type: Sequelize.INTEGER,
        defaultValue: null,
    },
    time_ghost_bump: {// "time_ghost_bump" int unsigned DEFAULT NULL,
        type: Sequelize.INTEGER                     ,
        defaultValue: null,
    },
    time_last_modified: {// "time_last_modified" int unsigned NOT NULL,
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    nreplies: {// "nreplies" int unsigned NOT NULL DEFAULT '0',
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    nimages: {// "nimages" int unsigned NOT NULL DEFAULT '0',
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    sticky: {// "sticky" bool NOT NULL DEFAULT '0',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    locked: {// "locked" bool NOT NULL DEFAULT '0',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
},
{// Table options
    freezeTableName: true
});


// CREATE TABLE IF NOT EXISTS "%%BOARD%%_images" (
const Image = sequelize.define(`${global_boardName}_images`,
{// Column definitions
    media_id: {// "media_id" int unsigned NOT NULL auto_increment,
        type: Sequelize.INTEGER,
        primaryKey: true,// primary key
        autoIncrement: true,
        allowNull: false,
    },
    media_hash: {// "media_hash" varchar(25) NOT NULL,
        type: Sequelize.STRING(25),
        allowNull: false,
        unique: 'media_hash_index',// UNIQUE media_hash_index ("media_hash"),
    },
    media: {// "media" varchar(20),
        type: Sequelize.STRING(20),
        allowNull: false,
    },
    preview_op: {// "preview_op" varchar(20),
        type: Sequelize.STRING(20),
    },
    preview_reply: {// "preview_reply" varchar(20),
        type: Sequelize.STRING(20),
    },
    total: {// "total" int(10) unsigned NOT NULL DEFAULT '0',
        type: Sequelize.BIGINT(10),
        allowNull: false,
        defaultValue: 0,
    },
    banned: {// "banned" smallint unsigned NOT NULL DEFAULT '0',
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
},
{// Table options
    freezeTableName: true
});


exports.sequelize = sequelize;
exports.Post = Post;
exports.Thread = Thread;
exports.Image = Image;
