const passport = require('passport');
const mongoUtil = require('../util/mongoUtil');

module.exports = (app) => {
    app.get('/auth/fetchUser', (req, res) => {
        res.send(req.user);
    });

    app.get('/auth/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    app.post('/doctorsLogin',
        passport.authenticate('doctors-auth', {successRedirect: '/', failureRedirect: '/'}));

    app.post('/usersLogin',
        passport.authenticate('users-auth', {successRedirect: '/', failureRedirect: '/'}));

    app.post('/doctorsSignup', (req, res) => {
        let db = mongoUtil.getDb();
        let doctorsCollection = db.collection('doctors');

        let doctor = ({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            city: req.body.city,
            password: req.body.password,
            specialisation: req.body.specialisation
        });

        doctorsCollection.insert(doctor)
            .then(function (result) {
                doctor._id = result.insertedIds[0];
                doctor.authType = 'doctors-auth';
                req.login(doctor, function () {
                    res.redirect('/todaysAppointments?msg=Welcome+to+mind.+You+are+successfully+registered.');
                })
            })
    });

    app.post('/usersSignup', (req, res) => {
        let db = mongoUtil.getDb();
        let usersCollection = db.collection('users');

        let user = ({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            city: req.body.city,
            password: req.body.password,
            medicalCondition: req.body.medicalCondition
        });

        usersCollection.insert(user)
            .then(function (result) {
                user._id = result.insertedIds[0];
                user.authType = 'users-auth';
                req.login(user, function () {
                    res.redirect('/doctors?msg=Welcome+to+mind.+You+are+successfully+registered.');
                })
            })
    });
};