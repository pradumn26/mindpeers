const express = require('express');
const cookieSession = require('cookie-session');
const passport = require('passport');

const mongoUtil = require('./util/mongoUtil');

mongoUtil.connectToDb()
.then(function (db) {
    const app = express();

    app.use(express.urlencoded({extended: true}));
    app.use(express.json());
    app.use(cookieSession({
        maxAge: 30*24*3600*1000,
        keys: ['djdnkjkdn']
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    require('./util/passportUtil');
    require('./routes/authRoutes')(app);
    require('./routes/userRoutes')(app);
    require('./routes/doctorsRoutes')(app);

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, function () {
        console.log(`App has started on port ${PORT}`);
    })
})
.catch(function (err) {
    console.log(err);
});