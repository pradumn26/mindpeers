const ObjectId = require('mongodb').ObjectId;

const mongoUtil = require('../util/mongoUtil');

module.exports = (app) => {
    app.post('/confirmAppointment', (req, res) => {
        if (!req.user || req.user.authType == 'users-auth')
            return res.send("not authorised");

        if (!req.body.appointment_id)
            return res.send({err: "please specify appointment_id"});

        let db = mongoUtil.getDb();
        let appointmentsCollection = db.collection('appointments');

        appointmentsCollection.findOneAndUpdate(
            {_id: ObjectId(req.body.appointment_id)},
            {$set: {status: "confirmed"}},
            {returnNewDocument: true}
        )
            .then(function (appointment) {
                if (appointment.status == 'confirmed') {
                    res.send({success: true});

                    //TODO send notification to user
                }
                else
                    res.send({success: false});
            })
    })
};