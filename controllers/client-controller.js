const express = require('express');
const router = express.Router();
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
const { routeEmailParamSchema, routePositiveNumberMiscParamSchema, routeStringMiscParamSchema, routeBooleanParamSchema, routePasswordParamSchema, } = require('../yup-schemas/request-params');
const { encrypt, decrypt } = require('../utils/crypto-helper');
const mailService = require('../api-services/mailer-service');

const findById = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json(await clientService.findById(req.params.id));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const playedCourses = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.params.nano_id);
        res.status(200).json(await clientService.playedCourses(req.params.nano_id));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const playerInfo = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.params.nano_id);
        res.status(200).json(await clientService.playerInfo(req.params.nano_id));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const dashboardInfo = async (req, res) => {
    try {
        // setTimeout(async () => {
        //     const id = decrypt(req.whom.id);
        //     res.status(200).json(await clientService.dashboardInfo(id));
        // }, 5000);
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
        const id = decrypt(req.whom.id);
        // First thing First: validate hcp in request body
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
        const id = decrypt(req.whom.id);
        const tokens = await clientService.updateEmail(id, req.params.nano_id);
        res.cookie('session', tokens.refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
        //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
        res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
        res.setHeader('authorization', 'Bearer ' + tokens.accessToken);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const markEmailForUpdate = async (req, res) => {
    try {
        const mail_otp = await otpMailService.findByEmail(req.body.email);
        if(mail_otp){
            const clientObj = req.body;
            verifyOTPtoken(clientObj, mail_otp.otp);
            // check if submitted otp is same as db otp
            if(clientObj.decodedOTP !== clientObj.otp){
                return res.status(400).json({'message': 'OTP verification failed.\nPlease request a new OTP and continue'});
            }
            const id = decrypt(req.whom.id);
            const user_type = encrypt('1');
            const response = await clientService.markEmailForUpdate(id, req.body.email);
            await mailService.sendMail(response.current_email, 'Email Update Request', 
                `This message is from RockMade Golf. 
            A request to update your email was initiated. Please use the link below to continue
            ${process.env.BASE_URL}/profile/${user_type}/email/update/${response.nano_id}.
            If you did not initiate this process, please ignore this email.`);

            res.status(201).json({'message': `A mail has been sent to ${response.current_email}. Access the mail to continue the process.`});
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
        // First thing First: validate current and new passwords in request body
        routePasswordParamSchema.validateSync(decrypt(req.body.pw));
        const id = decrypt(req.whom.id);
        await clientService.updatePassword(id, req.body);
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
        
        // Send the email
        await mailService.sendMail(email, 'Password Reset', `A password reset process has been initiated and your password has been reset successfully, please use this password ${pw} to login into your account. You can change it in your dashboard.`);
        res.status(200).json({'message': 'Password reset successfull\nPlease check your email for new password.\nIf not found in your inbox, please check your spam'});
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

// for use by players to search other players
const playerSearch = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        routePositiveNumberMiscParamSchema.validateSync(req.query.page_size);
        routeBooleanParamSchema.validateSync(req.query.hc);
        routeStringMiscParamSchema.validateSync(req.query.cursor);
        const player_id = decrypt(req.query.cursor);
        res.status(200).json( await clientService.playerSearch(id, req.query.hc, player_id, req.query.page_size) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

// for use by players to search other players using name query string
const playerQryStrSearch = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        routePositiveNumberMiscParamSchema.validateSync(req.query.page_size);
        routeBooleanParamSchema.validateSync(req.query.hc);
        routeStringMiscParamSchema.validateSync(req.query.cursor);
        routeStringMiscParamSchema.validateSync(req.query.queryStr);
        const player_id = decrypt(req.query.cursor);
        res.status(200).json( await clientService.playerQryStrSearch(id, req.query.hc, player_id, req.query.page_size, req.query.queryStr) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

// for use by admin to search players
const search = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.query.str);
        routeBooleanParamSchema.validateSync(req.query.status);
        res.status(200).json( await clientService.search(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const gameUserSearch = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.query.str);
        res.status(200).json( await clientService.gameUserSearch(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const getImg = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.params.filename);
        const filePath = path.join(__dirname, "..", "dp-upload", `${req.params.filename}.webp`)
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
router.route('/profile/email/update').put( verifyAccessToken, validate(email_schema), markEmailForUpdate );
router.route('/profile/email/update/:nano_id').get( verifyAccessToken, updateEmail );
router.route('/profile/dp/update').post(verifyAccessToken, multerImgUpload, dpUpload );
router.route('/pw/reset').put( resetPassword );
router.route('/search/mail').get( verifyAccessToken, preAuthorize(authorities.clientSearch.code), findByEmail );
router.route('/search/:id').get( verifyAccessToken, preAuthorize(authorities.clientSearch.code), findById );
router.route('/profile').get( verifyAccessToken, myProfile );
router.route('/dashboard').get( verifyAccessToken, dashboardInfo );
router.route('/dashboard/games/player/:nano_id').get( verifyAccessToken, playerInfo );
router.route('/courses/played/:nano_id').get( verifyAccessToken, playedCourses );
router.route('/dp/:filename').get( getImg );
router.route('/query').get( verifyAccessToken, search );
router.route('/players').get( verifyAccessToken, playerSearch );
router.route('/players/query').get( verifyAccessToken, playerQryStrSearch );
router.route('/game/query').get( verifyAccessToken, gameUserSearch );

module.exports = router;