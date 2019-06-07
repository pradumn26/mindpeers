const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const ObjectId = require('mongodb').ObjectId;

const db = require('./mongoUtil').getDb();

passport.serializeUser(function(document, done) {
    done(null, {id:document._id, authType: document.authType});
});

passport.deserializeUser(function(data, done) {
    let col = data.authType == 'doctors-auth' ? 'doctors' : 'users';
    let collection = db.collection(col);

    collection.findOne({_id: ObjectId(data.id)})
        .then(function (doc) {
            doc.authType = data.authType;
            done(null, doc);
        })
        .catch(function (err) {
            done(err);
        })
});

passport.use('doctors-auth', new LocalStrategy(
    {usernameField: 'email', passwordField: 'password'},
    function(email, password, done) {
        let doctorsCollection = db.collection('doctors');

        console.log(email, password);

        doctorsCollection.findOne({email, password})
            .then(function (doctor) {
                if (!doctor)
                    return done(null, false);

                doctor.authType = 'doctors-auth';
                return done(null, doctor);
            })
            .catch(function (err) {
                done(err);
            })
    }
));

passport.use('users-auth', new LocalStrategy(
    {usernameField: 'email', passwordField: 'password'},
    function(email, password, done) {
        let usersCollection = db.collection('users');

        usersCollection.findOne({email, password})
            .then(function (user) {
                if (!user)
                    return done(null, false);

                user.authType = 'users-auth';
                return done(null, user);
            })
            .catch(function (err) {
                done(err);
            })
    }
));