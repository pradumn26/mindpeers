const ObjectId = require('mongodb').ObjectId;
const moment = require('moment');

const mongoUtil = require('../util/mongoUtil');
const constants = require('../config/constants');

module.exports = (app) => {
    app.get('/fetchDoctors', (req, res) => {
        if (!req.user)
            return res.send("not authorised");

        let db = mongoUtil.getDb();
        let doctorsCollection = db.collection('doctors');

        doctorsCollection.find({}, {name: 1, specialisation: 1}).toArray()
            .then(function (doctors) {
                res.send(doctors);
            })
            .catch(function (err) {
                res.send(err);
            })
    });

    app.post('/fetchTimeSlots', (req, res) => {
        if (!req.user)
            return res.send("not authorises");

        if (!req.body.doctor_id)
            return res.send({err: "please specify doctor_id"});

        let db = mongoUtil.getDb();
        let appointmentsCollection = db.collection('appointments');

        appointmentsCollection.find({
            doctor_id: ObjectId(req.body.doctor_id),
            date: moment().format('YYYY-MM-DD')
        }).toArray()
            .then(function (todaysAppointments) {
                let map = {};
                let timeNow = moment().format('HH:mm');

                console.log(todaysAppointments);

                todaysAppointments.map(function (v) {
                    map[v.startTime] = true;
                });

                console.log(map);
                let availableTimeSlots = [];
                constants.TIME_SLOTS.map(function (v) {
                    let x = {startTime: v.startTime, endTime: v.endTime};
                    console.log(map[v.startTime]);
                    if (map[v.startTime] !== undefined || moment(v.startTime, 'HH:mm') < moment(moment().add(330, 'minutes').format('HH:mm'), 'HH:mm'))
                        x.enable = false;
                    else
                        x.enable = true;

                    availableTimeSlots.push(x);
                });

                res.send(availableTimeSlots);
            })
    });

    app.post('/bookAppointment', (req, res) => {
        if (!req.user)
            return res.send("not authorises");

        if (!req.body.doctor_id || !req.body.start_time || !req.body.end_time)
            return res.send({err: "some parameters are missing"});

        let appointment = {
            user_id: ObjectId(req.user._id),
            doctor_id: ObjectId(req.body.doctor_id),
            date: moment().format('YYYY-MM-DD'),
            startTime: req.body.start_time,
            endTime: req.body.end_time,
            bookingTime: new Date(),
            status: "not confirmed"
        };

        let db = mongoUtil.getDb();
        let appointmentsCollection = db.collection('appointments');
        let notificationsCollection = db.collection('notifications');

        appointmentsCollection.insert(appointment)
            .then(function (result) {
                if (result.insertedIds[0] === undefined) {
                    res.send({success: false});
                }
                else {
                    res.send({success: true});

                    let notifications = [
                        {
                            text: `Your appointment scheduled for ${moment().format('DD/MM/YYYY')} ${req.body.start_time}. Please check appointments to track your appointment.`,
                            user_id: ObjectId(req.user._id),
                            tstamp: new Date(),
                            url: '/myAppointments'
                        },

                        {
                            text: `You have appointment request from ${req.user.name} at ${req.body.start_time}.`,
                            user_id: ObjectId(req.body.doctor_id),
                            tstamp: new Date(),
                            url: '/todaysAppointments'
                        }
                    ];

                    notificationsCollection.insertMany(notifications);
                }
            })
    });

    app.get('/fetchAppointments', (req, res) => {
        if (!req.user)
            return res.send("Not authorised");

        let db = mongoUtil.getDb();
        let appointmentsCollection = db.collection('appointments');

        appointmentsCollection.aggregate([
            {$match: {user_id: ObjectId(req.user._id)}},
            {$sort: {bookingTime: -1}},
            {$lookup: {from: 'doctors', localField: 'doctor_id', foreignField: '_id', as: 'doctor'}},
            {$unwind: '$doctor'},
            {$addFields: {doctor_name: '$doctor.name'}},
            {$project: {doctor: 0}}
        ]).toArray()
            .then(function (appointments) {
                res.send(appointments);
            })
            .catch(function (err) {
                res.send(err);
            })
    })
};