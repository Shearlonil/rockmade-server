const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const nodemailer = require("nodemailer");

const clientService = require('../api-services/client-service');
const staffService = require('../api-services/staff-service');
const otpMailService = require('../api-services/mail-otp-service');
const { createRefreshToken, createClientAccessToken, logout, createStaffAccessToken, createOTPtoken, handleRefresh } = require('../middleware/jwt');
const { generateOTP } = require('../utils/otp-generator');
const { routeEmailParamSchema, routePasswordParamSchema } = require('../yup-schemas/request-params');
const { encrypt, decrypt } = require('../utils/crypto-helper');

const clientLogin = async (req, res) => {
    const { email, pw } = req.body;
    try {
        const decrypted_pw = decrypt(pw);
        // First thing First: validate email in request body
        routeEmailParamSchema.validateSync(email);
        // validate id in request paarameter
        routePasswordParamSchema.validateSync(decrypted_pw);
        // find from db using email
        const found = await clientService.findByEmail(email);
        // if no match from db or found but account deactivated, return error
        if(!found || found.status === false) return res.status(400).json({'message': 'Invalid email or password'});
        // if match, then compare password
        const match = await bcrypt.compare(decrypted_pw, found.pw);
        if(match) {
            //  set mode in found to be used in refresh token creation. 0 for Staff, 1 for Client
            found.mode = encrypt('1');
            // create jwt access token
            const accessToken = createClientAccessToken(found);
            // create jwt refresh token
            const refreshToken = createRefreshToken(found);
            // save refresh token with associated client in db

            res.cookie('session', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 }); //
            //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
            res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
            // res.setHeader("X-Suggested-Filename", originalname);
            res.setHeader('authorization', 'Bearer ' + accessToken);
            res.status(200).json({'message': 'Login successful'});
        }else {
            res.status(400).json({'message': 'Invalid email or password'});
        }
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
    
}

const staffLogin = async (req, res) => {
    const { email, pw } = req.body;
    try {
        const decrypted_pw = decrypt(pw);
        // First thing First: validate email in request body
        routeEmailParamSchema.validateSync(email);
        // validate id in request paarameter
        routePasswordParamSchema.validateSync(decrypted_pw);
        // find from db using email
        const found = await staffService.findByEmail(email);
        // if no match from db or found but account deactivated, return error
        if(!found || found.status === false) return res.status(400).json({'message': 'Invalid email or password'});
        // if match, then compare password
        const match = await bcrypt.compare(decrypted_pw, found.pw);
        if(match) {
            //  set mode in found to be used in refresh token creation. 0 for Staff, 1 for Client
            found.mode = encrypt('0');
            // create jwt access token
            const accessToken = createStaffAccessToken(found);
            // create jwt refresh token
            const refreshToken = createRefreshToken(found);
            /*  NOTE: When testing with thunder client, remove the 'secure: true' flag to enable thunder client work with the cookie.   */
            res.cookie('session', refreshToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 30 * 24 * 60 * 60 * 1000 }); //, secure: true
            //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
            res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
            // res.setHeader("X-Suggested-Filename", originalname);
            res.setHeader('authorization', 'Bearer ' + accessToken);
            res.status(200).json({'message': 'Login successful'});
        }else {
            res.status(400).json({'message': 'Invalid email or password'});
        }
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const otp = async (req, res) => {
    try {
        const email = req.params.email
        // First thing First: validate email in request paarameter
        routeEmailParamSchema.validateSync(email);
        // generate otp
        const oneTimePass = generateOTP(6);
        // create jwt token from otp
        const token = createOTPtoken(oneTimePass);
        
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_SERVICE_HOST,
            port: 465,
            secure: true, // Use true for port 465, false for all other ports
            auth: {
                user: process.env.MAIL_AUTH_USER,
                pass: process.env.MAIL_AUTH_USER_PASSWORD,
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        });
        // Configure the mailoptions object
        const mailOptions = {
            from: process.env.MAIL_AUTH_USER,
            to: email,
            subject: 'OTP',
            text: `This message is from RockMade Golf, please use the token ${oneTimePass} to continue your registration process.`
        };
        
        // Send the email
        await transporter.sendMail(mailOptions);
        // save email and associated token
        await otpMailService.saveOrUpdate(email, token);
        return res.status(200).json({'message': 'OTP sent'});
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const refresh = async (req, res) => {
    //  handleRefresh middleware in jwt module will first verify the refresh token in the cookie. If verified, then email and mode will be appended to the request
    //  find user based on mode (client or staff).
    try {
        res.sendStatus(200);
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
}

const logOut = async (req, res) => {
    //  handleRefresh middleware in jwt module will first verify the refresh token in the cookie. If verified, then email and mode will be appended to the request
    //  find user based on mode (client or staff).
    try {
        res.sendStatus(200);
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
}

router.route('/client').post(clientLogin);
router.route('/staff').post(staffLogin);
router.route('/otp/:email').post(otp);
router.route('/logout').get( logout, logOut );
router.route('/refresh').get(handleRefresh, refresh);

module.exports = router