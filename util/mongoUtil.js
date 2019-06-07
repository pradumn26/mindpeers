const MongoClient = require('mongodb').MongoClient;

const keys = require('./keys');

var DB = null;

function connectToDb() {
    return new Promise(function (resolve, reject) {
        MongoClient.connect(keys.mongoURI, function(err, client) {
            if (err)
                reject(err);

            console.log("Connected successfully to server");
            const db = client.db('mindpeers-dev');
            DB = db;

            resolve(DB);
        });
    })
}

function getDb() {
    return DB;
}

module.exports = {
    connectToDb,
    getDb
}