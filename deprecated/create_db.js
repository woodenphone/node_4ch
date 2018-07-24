// create_db.js
// Create the DB
const sqlite3 = require('sqlite3');
const fs = require('fs');

const dbName = 'junk.db'

function createDB (dbPath) {
    var db = new sqlite3.Database(dbPath);
    fs.readFile('create_db.sql', (err, buf) => {
        if (err) console.log('ERROR:', err);
        else {
            console.log(`EXECUTING: ${buf}`)
            db.run(buf.toString());
        }
    });
};

createDB(dbName);