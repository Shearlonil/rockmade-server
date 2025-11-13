const express = require('express');
const router = express.Router();
const nodemailer = require("nodemailer");
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const { authorities } = require('../utils/default-entries');
const preAuthorize = require('../middleware/verify-authorities');
const { verifyAccessToken, verifyOTPtoken, createClientAccessToken, createRefreshToken } = require('../middleware/jwt');
const validate = require('../middleware/schemer-validator');
const multerImgUpload = require('../utils/multer-img-upload');
const schema = require('../yup-schemas/user-schema');
const updateSchema = require('../yup-schemas/user-update-schema');
const otpMailService = require('../api-services/mail-otp-service');
const clientService = require('../api-services/client-service');
const { routeEmailParamSchema, routePositiveNumberMiscParamSchema, routePasswordParamSchema, routeStringMiscParamSchema } = require('../yup-schemas/request-params');

const findById = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json(await clientService.findById(req.params.id));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const myProfile = async (req, res) => {
    try {
        res.status(200).json(await clientService.findById(req.whom.id));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const findByEmail = async (req, res) => {
    try {
        routeEmailParamSchema.validateSync(req.body.email);
        res.status(200).json(await clientService.findByEmail(email));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const register = async (req, res) => {
    try {
        const mail_otp = await otpMailService.findByEmail(req.body.email); 
        if(mail_otp){ 
            const clientObj = req.body;
            // verifyOTPtoken(clientObj, mail_otp.otp);
            // check if submitted otp is same as db otp
            if(clientObj.decodedOTP !== clientObj.otp){
                // cleanUpFileUpload(req.file);
                // return res.status(400).json({'message': 'OTP verification failed.\nPlease request a new OTP and continue'});
            }
            // if dp is available
            if(req.file) {
                clientObj.dp = req.file;
            }
            // create account
            const client = await clientService.register(clientObj);
            // set mode to use in refresh token (specifies staff or client, 0 for Staff, 1 for Client)
            client.mode = 1;
            // create jwt access token
            const accessToken = createClientAccessToken(client);
            // create jwt refresh token
            const refreshToken = createRefreshToken(client);
            res.cookie('session', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
            //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
            res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
            // res.setHeader("X-Suggested-Filename", originalname);
            res.setHeader('authorization', 'Bearer ' + accessToken);
            cleanUpFileUpload(req.file);
            res.status(201).json({'message': 'Account Creation successful'});
        }else {
            cleanUpFileUpload(req.file);
            res.status(400).json({'message': "No associated mail found with otp."});
        }  
    } catch (error) {
        cleanUpFileUpload(req.file);
        res.status(400).json({'message': error.message});
    }
};

const update = async (req, res) => {
    try {
        const clientObj = req.body;
        const updatedClient = await clientService.update(req.whom.id, clientObj);
        // create jwt access token
        const accessToken = createClientAccessToken(updatedClient);
        //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
        res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
        res.setHeader('authorization', 'Bearer ' + accessToken);
        res.status(200).json(updatedClient);
    } catch (error) {
        cleanUpFileUpload(req.file);
        return res.status(400).json({'message': error.message});
    }
}

const updateEmail = async (req, res) => {
    try {
        const email = req.body.email;
        // First thing First: validate email in request body
        routeEmailParamSchema.validateSync(email);
        const client = clientService.updateEmail(req.whom.id, email);
        // set mode to use in refresh token (specifies staff or client, 0 for Staff, 1 for Client)
        client.mode = 1;
        // create jwt refresh token
        const refreshToken = createRefreshToken(client);
        res.cookie('session', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
        res.status(200).json({'message': 'Email update successful'});
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const dpUpload = async (req, res) => {
    if(!req.file){
        return res.status(400).json({'message': "No File attached"});
    }
    try {
        // find client from db using id in request parameter
        const client = await clientService.findById(req.whom.id);
        if(!client) {
            // delete uploaded dp
            cleanUpFileUpload(req.file);
            return res.status(400).json({'message': "Not Found"});
        }
        // get file extension
        const fileExtension = path.extname(path.join(__dirname, "..", "dp-upload", req.file.filename));
        // rename dp name to client email
        await fsPromises.rename(path.join(__dirname, "..", "dp-upload", req.file.filename), path.join(__dirname, "..", "dp-upload", client.id + fileExtension));
        // dp uploaded
        client.dp = true;
        res.status(200).json({'message': 'dp upload successful'});
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updatePassword = async (req, res) => {
    try {
        const current_pw = req.body.current_pw;
        const new_pw = req.body.new_pw;
        // First thing First: validate current and new passwords in request body
        routePasswordParamSchema.validateSync(current_pw);
        routePasswordParamSchema.validateSync(new_pw);
        // find client from db using id in request parameter
        const client = await clientService.findForPassWord(req.whom.id);
        if(!client) {
            return res.status(400).json({'message': "Not Found"});
        }
        // check if current password is correct
        // if match, then compare password
        const match = await bcrypt.compare(current_pw, client.pw);
        if(match) {
            await clientService.updatePassword(req.whom.id, new_pw);
            res.status(200).json({'message': 'Password update successfull'});
        }else {
            res.status(401).json({'message': 'Invalid password'});
        }
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const resetPassword = async (req, res) => {
    try {
        const email = req.body.email;
        const fname = req.body.fname;
        const lname = req.body.lname;
        // First thing First: validate email, fname and lname in request body
        routeEmailParamSchema.validateSync(email);
        routeStringMiscParamSchema.validateSync(fname);
        routeStringMiscParamSchema.validateSync(lname);
        // reset password
        const pw = await clientService.resetPassword(req.body);

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_SERVICE_HOST,
            port: 465,
            secure: true, // Use true for port 465, false for all other ports
            auth: {
                user: process.env.MAIL_AUTH_USER,
                pass: process.env.MAIL_AUTH_USER_PASSWORD,
            },
        });
        // Configure the mailoptions object
        const mailOptions = {
            from: process.env.MAIL_AUTH_USER,
            to: email,
            subject: 'Password Reset',
            text: `A password reset process has been initiated and your password has been reset successfully, please use this password ${pw} to login into your account. You can change it in your dashboard.`
        };
        
        // Send the email
        await transporter.sendMail(mailOptions);
        res.status(200).json({'message': 'Password reset successfull\nPlease check your email for new password.\nIf not found in your inbox, please check your spam'});
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

// PRIVATE METHODS
'=================================='

const cleanUpFileUpload = async (file) => {
    // possibility of successful file upload
    // handle file delete in case of multer file upload
    if(file && fs.existsSync(path.join(__dirname, "..", "file-upload", file.filename)) ){
        await fsPromises.unlink(path.join(__dirname, "..", "file-upload", file.filename));
    }
};

router.route('/onboarding').post(multerImgUpload, validate(schema), register );
router.route('/profile/update').put( verifyAccessToken, validate(updateSchema), update );
router.route('/pw/update').put( verifyAccessToken, updatePassword );
router.route('/pw/reset').put( resetPassword );
router.route('/email/update').put( verifyAccessToken, updateEmail );
router.route('/search').get( verifyAccessToken, preAuthorize(authorities.clientSearch.code), findByEmail );
router.route('/search/:id').get( verifyAccessToken, preAuthorize(authorities.clientSearch.code), findById );
router.route('/profile').get( verifyAccessToken, myProfile );

module.exports = router;