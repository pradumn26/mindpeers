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
        let notificationsCollection = db.collection('notifications');

        appointmentsCollection.findOneAndUpdate(
            {_id: ObjectId(req.body.appointment_id)},
            {$set: {status: "confirmed"}},
            {returnOriginal: false, returnNewDocument: true}
        )
            .then(function (appointment) {
                if (appointment.value.status == 'confirmed') {
                    res.send({success: true});

                    let notification = {
                        text: `Your appointment at ${appointment.value.startTime} has been confirmed by the doctor.`,
                        user_id: ObjectId(appointment.value.user_id),
                        tstamp: new Date(),
                        url: '/myAppointments'
                    }

                    notificationsCollection.insert(notification);
                }
                else
                    res.send({success: false});
            })
    });

    app.get('/fetchTodaysAppointments', (req, res) => {
        if (!req.user)
            return res.send("Not authorised");

        let db = mongoUtil.getDb();
        let appointmentsCollection = db.collection('appointments');

        appointmentsCollection.aggregate([
            {$match: {doctor_id: ObjectId(req.user._id)}},
            {$sort: {bookingTime: -1}},
            {$lookup: {from: 'users', localField: 'user_id', foreignField: '_id', as: 'user'}},
            {$unwind: '$user'},
            {$addFields: {user_name: '$user.name', user_medical_condition: '$user.medicalCondition'}},
            {$project: {user: 0}}
        ]).toArray()
            .then(function (appointments) {
                res.send(appointments);
            })
            .catch(function (err) {
                res.send(err);
            })
    })
};