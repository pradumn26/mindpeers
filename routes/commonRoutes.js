const mongoUtil = require('../util/mongoUtil');
const ObjectId = require('mongodb').ObjectId;

module.exports = (app) => {
    app.get('/fetchNotifications', (req, res) => {
        if (!req.user)
            return res.send("Not authorised");

        let db = mongoUtil.getDb();
        let notificationsCollection = db.collection('notifications');

        notificationsCollection.aggregate([
            {$match: {user_id: ObjectId(req.user._id)}},
            {$sort: {tstamp: -1}}
        ]).toArray()
            .then(function (notifications) {
                res.send(notifications);
            })
            .catch(function (err) {
                res.send(err);
            })
    });
};