require('dotenv').config();
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

const corsOptions = require('./config/cors-options');
const db = require('./config/entities-config');
const setUp = require('./api-services/app-setup-service');
const credentials = require('./middleware/credentials');

db.connect();

const PORT = process.env.PORT || 2025;

// Handle options credentials check - before CORS! and fetch cookies credentials requirement
app.use(credentials);

// CROSS ORIGIN RESOURCE SHARING
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded data aka form-data
// 'content-type' application/x-www-form-urlencoded
app.use(express.urlencoded({ extended : true }));

// built-in middleware for application/json
app.use(express.json());

// for cookies
app.use(cookieParser());

// setup default admin account
// setUp();

// ROUTES
app.use('/auth', require('./controllers/authentication-controller'));
app.use('/staff', require('./controllers/staff-controller'));
app.use('/courses', require('./controllers/course-controller'));
app.use('/contests', require('./controllers/contest-controller'));
app.use('/countries', require('./controllers/country-controller'));
app.use('/users', require('./controllers/client-controller'));

/*  ref: https://stackoverflow.com/questions/27928372/react-router-urls-dont-work-when-refreshing-or-writing-manually
    check neeraj-dixit27's solution on the above thread
    note this route should go after any other routes as it's a catch all
*/
app.get('/{*any}', (request, response) => {
    response.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));