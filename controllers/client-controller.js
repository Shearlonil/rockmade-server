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
const { personal_info_schema, pw_schema, hcp_schema, email_schema } = require('../yup-schemas/user-update-schema');
const otpMailService = require('../api-services/mail-otp-service');
const clientService = require('../api-services/client-service');
const { routeEmailParamSchema, routePositiveNumberMiscParamSchema, routeStringMiscParamSchema, routeBooleanParamSchema } = require('../yup-schemas/request-params');
const { encrypt, decrypt } = require('../utils/crypto-helper');

const findById = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json(await clientService.findById(req.params.id));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const dashboardInfo = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        res.status(200).json(await clientService.dashboardInfo(id));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const myProfile = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        res.status(200).json(await clientService.findActiveById(id));
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
            verifyOTPtoken(clientObj, mail_otp.otp);
            // check if submitted otp is same as db otp
            if(clientObj.decodedOTP !== clientObj.otp){
                cleanUpFileUpload(req.file);
                return res.status(400).json({'message': 'OTP verification failed.\nPlease request a new OTP and continue'});
            }
            // if dp is available
            if(req.file) {
                clientObj.dp = req.file;
            }
            // create account
            const client = await clientService.register(clientObj);
            // set mode to use in refresh token (specifies staff or client, 0 for Staff, 1 for Client)
            client.mode = encrypt('1');
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

const updatePersonalInfo = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        const updatedClient = await clientService.updatePersonalInfo(id, req.body);
        // set mode to use in refresh token (specifies staff or client, 0 for Staff, 1 for Client)
        updatedClient.mode = encrypt('1');
        // create jwt access token
        const accessToken = createClientAccessToken(updatedClient);
        //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
        res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
        res.setHeader('authorization', 'Bearer ' + accessToken);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const updateHomeClub = async (req, res) => {
    try {
        // routePositiveNumberMiscParamSchema.validateSync(req.body.id);
        const id = decrypt(req.whom.id);
        const updatedClient = await clientService.updateHomeClub(id, req.body.id);
        // set mode to use in refresh token (specifies staff or client, 0 for Staff, 1 for Client)
        updatedClient.mode = encrypt('1');
        // create jwt access token
        const accessToken = createClientAccessToken(updatedClient);
        //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
        res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
        res.setHeader('authorization', 'Bearer ' + accessToken);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const updateHCP = async (req, res) => {
    try {
        // First thing First: validate hcp in request body
        const id = decrypt(req.whom.id);
        const updatedClient = await clientService.updateHCP(id, req.body.hcp);
        // set mode to use in refresh token (specifies staff or client, 0 for Staff, 1 for Client)
        updatedClient.mode = encrypt('1');
        // create jwt access token
        const accessToken = createClientAccessToken(updatedClient);
        //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
        res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
        res.setHeader('authorization', 'Bearer ' + accessToken);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updateEmail = async (req, res) => {
    try {
        const mail_otp = await otpMailService.findByEmail(req.body.email);
        if(mail_otp){
            const clientObj = req.body;
            verifyOTPtoken(clientObj, mail_otp.otp);
            // check if submitted otp is same as db otp
            if(clientObj.decodedOTP !== clientObj.otp){
                return res.status(400).json({'message': 'OTP verification failed.\nPlease request a new OTP and continue'});
            }
            const client = await clientService.updateEmail(req.whom.id, req.body.email);
            // set mode to use in refresh token (specifies staff or client, 0 for Staff, 1 for Client)
            client.mode = encrypt('1');
            // create jwt refresh token
            const refreshToken = createRefreshToken(client);
            res.cookie('session', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
            // create jwt access token
            const accessToken = createClientAccessToken(client);
            //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
            res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
            res.setHeader('authorization', 'Bearer ' + accessToken);
            res.sendStatus(200);
        }else {
            res.status(400).json({'message': "No associated mail found with otp."});
        } 
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
        const id = decrypt(req.whom.id);
        const client = await clientService.findActiveById(id);
        if(!client) {
            // delete uploaded dp
            cleanUpFileUpload(req.file);
            return res.status(400).json({'message': "Not Found"});
        }
        const updatedClient = await clientService.updateProfileImg(id, req.file);
        // set mode to use in refresh token (specifies staff or client, 0 for Staff, 1 for Client)
        updatedClient.mode = encrypt('1');
        // create jwt access token
        const accessToken = createClientAccessToken(updatedClient);
        //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
        res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
        res.setHeader('authorization', 'Bearer ' + accessToken);
        cleanUpFileUpload(req.file);
        res.sendStatus(200);
    } catch (error) {
        cleanUpFileUpload(req.file);
        return res.status(400).json({'message': error.message});
    }
};

const updatePassword = async (req, res) => {
    try {
        await clientService.updatePassword(req.whom.id, req.body);
        res.sendStatus(200);
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

const search = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.query.str);
        routeBooleanParamSchema.validateSync(req.query.status);
        res.status(200).json( await clientService.search(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const gameSearch = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.query.str);
        res.status(200).json( await clientService.gameSearch(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const getImg = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.params.filename);
        const filePath = path.join(__dirname, "..", "dp-upload", `${req.params.filename}.webp`)
        console.log(filePath);
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({'message': "File Not Found"});
        }
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

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
router.route('/profile/info/update').put( verifyAccessToken, validate(personal_info_schema), updatePersonalInfo );
router.route('/profile/hc/update').put( verifyAccessToken, updateHomeClub );
router.route('/profile/hcp/update').put( verifyAccessToken, validate(hcp_schema), updateHCP );
router.route('/profile/pw/update').put( verifyAccessToken, validate(pw_schema), updatePassword );
router.route('/profile/email/update').put( verifyAccessToken, validate(email_schema), updateEmail );
router.route('/profile/dp/update').post(verifyAccessToken, multerImgUpload, dpUpload );
router.route('/pw/reset').put( resetPassword );
router.route('/search/mail').get( verifyAccessToken, preAuthorize(authorities.clientSearch.code), findByEmail );
router.route('/search/:id').get( verifyAccessToken, preAuthorize(authorities.clientSearch.code), findById );
router.route('/profile').get( verifyAccessToken, myProfile );
router.route('/dashboard').get( verifyAccessToken, dashboardInfo );
// router.route('/dp/:id').get( verifyAccessToken, downloadProfileImg );
router.route('/dp/:filename').get( getImg );
router.route('/query').get( verifyAccessToken, search );
router.route('/game/query').get( verifyAccessToken, gameSearch );

module.exports = router;