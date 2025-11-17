const jwt = require('jsonwebtoken');

const staffService = require('../api-services/staff-service');
const clientService = require('../api-services/client-service');
const {encrypt, decrypt} = require('../utils/crypto-helper');

const createOTPtoken = otp => {
    return jwt.sign({
        otp
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '5m'} );
}

const verifyOTPtoken = (client, token) => {
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err) {
                throw new Error('OTP verification failed.\nPlease request a new OTP and continue');
            }
            client.decodedOTP = decoded.otp;
        }
    );
}

const createClientAccessToken = (client) => {
    const sub = encrypt(client.sub_expiration);
    return jwt.sign({
        "whom": {
            id: client.id,
            fname: client.fname,
            lname: client.lname,
            gender: client.gender,
            email: client.email,
            // phone: client.phone,
            regDate: client.createdAt,
            hcp: client.hcp,
            sub
        },
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10m'} );
}

const createStaffAccessToken = (staff) => {
    const authorities = [];
    staff.Authorities.forEach( auth => authorities.push(auth.dataValues.code) );
    return jwt.sign({
        "whom": {
            id: staff.id,
            fname: staff.fname,
            lname: staff.lname,
            email: staff.email,
            roles: authorities
        },
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10m'} );
}

const verifyAccessToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if(!authHeader?.startsWith('Bearer ')) return res.sendStatus(403);  // Forbidden
    const token = authHeader.split(' ')[1];
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err) {
                if(err.name === 'TokenExpiredError') {
                    return res.sendStatus(401); // Unauthorized, A 401 typically signifies an expired access token.
                }
                return res.sendStatus(403); // Forbidden
            }
            req.whom = decoded.whom;
            next();
        }
    );
}

const createRefreshToken = (whom) => {
    return jwt.sign({
        "whom": {
            iv: encrypt(whom.email),
            // specifies staff or client, 0 for Staff, 1 for Client
            mode: whom.mode,
        },
    }, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'} );
}

const handleRefresh = (req, res) => {
    const cookies = req.cookies;
    // check if refresh token is available. if not, simply return 403 status
    if(!cookies?.session){
        return res.sendStatus(403); // Forbidden
    }
    // cookie is available
    jwt.verify(
        cookies.session,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if(err) {
                return res.sendStatus(403); // Forbidden
            }
            // create a new access token based on mode and send back to front end
            if(decoded.whom.mode === 0){
                // find staff with email
                const staff = await staffService.findByEmail(decrypt(decoded.whom.iv));
                // check status
                if(!staff || staff.status === false){
                    // if account deactivated, clear cookies
                    res.clearCookie('session', { httpOnly: true, sameSite: 'None', secure: true });
                    return res.sendStatus(403);
                }
                // create jwt access token
                const accessToken = createStaffAccessToken(staff);
                //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
                res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
                // res.setHeader("X-Suggested-Filename", originalname);
                res.setHeader('authorization', 'Bearer ' + accessToken);
                res.sendStatus(200);
            }else {
                // find client with email
                const client = await clientService.findByEmail(decrypt(decoded.whom.iv));
                // check status
                if(!client || client.status === false){
                    // if account deactivated, clear cookies
                    res.clearCookie('session', { httpOnly: true, sameSite: 'None', secure: true });
                    return res.sendStatus(403);
                }
                // create jwt access token
                const accessToken = createClientAccessToken(client);
                //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
                res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
                // res.setHeader("X-Suggested-Filename", originalname);
                res.setHeader('authorization', 'Bearer ' + accessToken);
                res.sendStatus(200);
            }
        }
    );
}

const logout = (req, res, next) => {
    const cookies = req.cookies;
    // check if refresh token is available. if not, simply return 204 status
    if(!cookies?.session){
        return res.sendStatus(204); // 204 => no content
    }
    // cookie is available, verify before deleting
    jwt.verify(
        cookies.session,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if(err){
                // if error, clear cookie on the front end
                res.clearCookie('session', { httpOnly: true, sameSite: 'None', secure: true });
                return res.sendStatus(204); // 204 => no content
            }
            res.clearCookie('session', { httpOnly: true, sameSite: 'None', secure: true });
            // in the client/staff controller, find the user in db with id stored in token then delete token field and update user in db
            next();
        }
    );
}

module.exports = {
    createOTPtoken,
    verifyOTPtoken,
    verifyAccessToken,
    createClientAccessToken,
    createStaffAccessToken,
    createRefreshToken,
    handleRefresh,
    logout,
};