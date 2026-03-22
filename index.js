require('dotenv').config();
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
// const rateLimit = require("express-rate-limit");
const path = require('path');

const app = express();

const corsOptions = require('./config/cors-options');
const db = require('./config/entities-config');
const setUp = require('./api-services/app-setup-service');
const credentials = require('./middleware/credentials');

db.connect();

const PORT = process.env.PORT || 2026;

// Handle options credentials check - before CORS! and fetch cookies credentials requirement
app.use(credentials);

// CROSS ORIGIN RESOURCE SHARING
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded data aka form-data: 'content-type' application/x-www-form-urlencoded
app.use(express.urlencoded({ extended : true }));

// built-in middleware for application/json
app.use(express.json());

// for cookies
app.use(cookieParser());

/*
// ref: https://medium.com/@ebojacky/building-a-production-ready-url-shortener-with-node-js-and-sqlite-9e4aa38a9db9
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
});
*/
// setup default admin account
// setUp();

// ROUTES
// app.use("/api/", limiter);
app.use('/auth', require('./controllers/authentication-controller'));
app.use('/staff', require('./controllers/staff-controller'));
app.use('/courses', require('./controllers/course-controller'));
app.use('/contests', require('./controllers/contest-controller'));
app.use('/countries', require('./controllers/country-controller'));
app.use('/users', require('./controllers/client-controller'));
app.use('/games', require('./controllers/game-controller'));
app.use('/subscriptions', require('./controllers/sub-plans-controller'));

/*  ref: https://stackoverflow.com/questions/27928372/react-router-urls-dont-work-when-refreshing-or-writing-manually
    check neeraj-dixit27's solution on the above thread
    note this route should go after any other routes as it's a catch all
*/
app.get('/{*any}', (request, response) => {
    response.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));