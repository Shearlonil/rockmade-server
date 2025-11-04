const allowedOrigins = require('./allowed-origins');

const corsOptions = {
    /*  parameter origin in function isn't the same as origin which is a property of corsOptions. Parameter is coming from whoever made a reqeust, e.g google.com   */
    origin: (origin, callback) => { 
        if(allowedOrigins.indexOf(origin) !== -1 || !origin){   // !origin should be removed in production, Use only in dev mode
            callback(null, true);
        }else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
}

module.exports = corsOptions;