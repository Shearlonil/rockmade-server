const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const staffService = require('../api-services/staff-service');

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

const createStaffAccessToken = (staff) => {
    return jwt.sign({
        "whom": {
            id: staff.id,
            fname: staff.fname,
            lname: staff.lname,
            email: staff.email,
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
                    return res.sendStatus(408); // Request Time out, we could also any suitable 4XX family to indicated expired token
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

const encrypt = (text) => {
    /*  refs: 
        https://www.makeuseof.com/nodejs-crypto-module-guide/
        https://medium.com/@tony.infisical/guide-to-nodes-crypto-module-for-encryption-decryption-65c077176980
        https://www.geeksforgeeks.org/node-js-crypto-createcipheriv-method/
    */

    // create cipher object
    const cipher = crypto.createCipheriv("aes-256-cbc", 
        Buffer.from(process.env.MAIL_CRYPTO_SECRET, 'base64'),
        Buffer.from(process.env.CRYPTO_IV, 'base64'));

    // encrypt the data
    let encryptedText = cipher.update(text, "utf-8", "hex");
    
    // finalize the encryption
    encryptedText += cipher.final("hex");
    return encryptedText;
}

const decrypt = (encryptedText) => {
    const decipher = crypto.createDecipheriv("aes-256-cbc", 
        Buffer.from(process.env.MAIL_CRYPTO_SECRET, 'base64'), 
        Buffer.from(process.env.CRYPTO_IV, 'base64'));
    
    // decrypt the data
    let decrypted = decipher.update(encryptedText, "hex", "utf-8");
    
    // finalize the decryption
    decrypted += decipher.final("utf-8");
    return decrypted;
}

module.exports = {
    createOTPtoken,
    verifyOTPtoken,
    verifyAccessToken,
    createStaffAccessToken,
    createRefreshToken,
    handleRefresh,
    logout,
};