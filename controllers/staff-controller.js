const express = require('express');
const router = express.Router();

const validate = require('../middleware/schemer-validator');
const { authorities } = require('../utils/default-entries');
const preAuthorize = require('../middleware/verify-authorities');
const { verifyAccessToken, createStaffAccessToken, verifyOTPtoken, createRefreshToken } = require('../middleware/jwt');
const { generateOTP } = require('../utils/otp-generator');
const staffService = require('../api-services/staff-service');
const mailOtpService = require('../api-services/mail-otp-service');
const { schema, personal_info_schema } = require('../yup-schemas/staff-schema');
const { email_schema } = require('../yup-schemas/user-update-schema');
const { routeEmailParamSchema, routeStringMiscParamSchema, routePasswordParamSchema, routePositiveNumberMiscParamSchema, routeBooleanParamSchema } = require('../yup-schemas/request-params');
const otpMailService = require('../api-services/mail-otp-service');
const { encrypt, decrypt } = require('../utils/crypto-helper');
const mailService = require('../api-services/mailer-service');

const findById = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json(await staffService.findById(req.params.id));
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
};

const findByIdWithAuths = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json(await staffService.findByIdWithAuths(req.params.id));
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
};

const findByEmail = async (req, res) => {
    try {
        routeEmailParamSchema.validateSync(req.body.email);
        res.status(200).json(await staffService.findByEmail(email));
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
};

const dashboardInfo = async (req, res) => {
    try {
        // client not allowed to view staff dashboard
        if(req.whom.type){
            res.sendStatus(403);
        }else {
            res.status(200).json(await staffService.dashboardInfo());
        }
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updatePersonalInfo = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        const updatedStaff = await staffService.updatePersonalInfo(id, req.body);
        // set mode to use in refresh token (specifies staff or client, 0 for Staff, 1 for Client)
        updatedStaff.mode = encrypt('0');
        // create jwt access token
        const accessToken = createStaffAccessToken(updatedStaff);
        //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
        res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
        res.setHeader('authorization', 'Bearer ' + accessToken);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

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
            const user_type = encrypt('0');
            const response = await staffService.markEmailForUpdate(id, req.body.email);
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

const updateEmail = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        const tokens = await staffService.updateEmail(id, req.params.nano_id);
        res.cookie('session', tokens.refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
        //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
        res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
        res.setHeader('authorization', 'Bearer ' + tokens.accessToken);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const findAll = async (req, res) => {
    try {
        res.status(200).json(await staffService.findAll());
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
}

const search = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.query.str);
        routeBooleanParamSchema.validateSync(req.query.status);
        res.status(200).json( await staffService.search(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const paginateFetch = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.query.page);
        routePositiveNumberMiscParamSchema.validateSync(req.query.pageSize);
        routeBooleanParamSchema.validateSync(req.query.status);
        res.status(200).json( await staffService.paginateFetch(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const updateStaffRoles = async (req, res) => {
    // endpoint will receive an array of roles in number format
    try {
        const id = decrypt(req.whom.id);
        if(id === req.body.id){
            // account cannot edit itself
            return res.sendStatus(404);
        }
        /*  updater cannot add authorities they don't have
            Algorithm returns false if a role which the current user doesn't have is found in the list of roles to be added to edited/updated account   
            returns undefined for empty list or truth case (supplied role list contains roles present in the current user making changes or updating account    */
        const result = req.body.authorities.map( role => req.whom.roles.includes(role.code) ).find(val => val === false);
        if(result === false) {
            return res.sendStatus(403); // Forbidden
        }
        await staffService.updateAuthorities(req.body)
        res.sendStatus(200);
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
}

const status = async (req, res) => {
    // endpoint will receive an object of form {staff_id, status}.
    try {
        const id = decrypt(req.whom.id);
        routePositiveNumberMiscParamSchema.validateSync(req.body.id);
        routeBooleanParamSchema.validateSync(req.body.status);
        if(id == req.body.id){
            // can't delete yourself
            return res.sendStatus(404);
        }
        res.status(200).json( await staffService.status(req.body));
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
}

const registerStaff = async (req, res) => {
    const email = req.body.email
    try {
        // First thing First: validate email in request paarameter
        routeEmailParamSchema.validateSync(email);
         // generate otp
        const oneTimePass = generateOTP(6);
        req.body.pw = oneTimePass;
        // create staff account
        const id = decrypt(req.whom.id);
        const staff = await staffService.register(req.body, id);
        
        try {
            await mailService.sendMail(email, 'Autogenerated Password', `This message is from RockMade Golf, please use the autogenerated password ${oneTimePass} to login. You may change the password whenever you like.`);
            res.status(201).json(staff);
        } catch (error) {
            // on error sending mail, delete account created earlier
            await staffService.deleteAccount(email);
            res.status(500).json({'message': "Unable to send mail"});
        }
    } catch (error) {
        return res.status(500).json({'message': error.message});
    }
};

const updatePassword = async (req, res) => {
    try {
        // First thing First: validate current and new passwords in request body
        routePasswordParamSchema.validateSync(decrypt(req.body.pw));
        const id = decrypt(req.whom.id);
        await staffService.updatePassword(id, req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

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
        const pw = await staffService.resetPassword(req.body);

        await mailService.sendMail(email, 'Password Reset', `A password reset process has been initiated and your password has been reset successfully, please use this password ${pw} to login into your account. You can change it in your dashboard.`);
        res.status(200).json({'message': 'Password reset successfull\nPlease check your email for new password.\nIf not found in your inbox, please check your spam'});
        /* Send the email
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                res.status(500).json({'message': error.response });
            } else {
                res.status(200).json({'message': 'Password reset successfull\nPlease check your email for new password.\nIf not found in your inbox, please check your spam'});
            }
        });
        */
    } catch (error) {
        return res.status(500).json({'message': error.message});
    }
}

const countUnverifiedMails = async (req, res) => {
    try {
        res.status(200).json(await staffService.countUnverifiedMails());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const getUnverifiedMails = async (req, res) => {
    try {
        res.status(200).json(await mailOtpService.findAll());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const clearAllUnverifiedMails = async (req, res) => {
    try {
        await mailOtpService.clearAll();
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const removeUnverifiedMail = async (req, res) => {
    try {
        routeEmailParamSchema.validateSync(req.params.email);
        await mailOtpService.remove(req.params.email)
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const countActiveStaff = async (req, res) => {
    const mode = decrypt(req.whom.mode);
    if(mode !== '0'){
        return res.sendStatus(404);
    }
    try {
        res.status(200).json(await staffService.countActiveStaff());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const getAuthorities = async (req, res) => {
    const mode = decrypt(req.whom.mode);
    if(mode !== '0'){
        return res.sendStatus(404);
    }
    res.status(200).json( await staffService.getAuthorities());
};

const activeStaffPageInit = async (req, res) => {
    try {
        const mode = decrypt(req.whom.mode);
        if(mode !== '0'){
            return res.sendStatus(404);
        }
        routePositiveNumberMiscParamSchema.validateSync(req.params.pageSize);
        res.status(200).json(await staffService.activeStaffPageInit(req.params.pageSize));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

router.route('/register').post( verifyAccessToken, validate(schema), preAuthorize(authorities.addStaffAccount.code), registerStaff );
router.route('/auths').get( verifyAccessToken, getAuthorities );
router.route('/unverified-mails').get( verifyAccessToken, countUnverifiedMails );
router.route('/unverified-mails/view').get( verifyAccessToken, preAuthorize(authorities.viewClients.code), getUnverifiedMails );
router.route('/unverified-mails/clear').get( verifyAccessToken, preAuthorize(authorities.viewClients.code), clearAllUnverifiedMails );
router.route('/unverified-mails/remove/:email').get( verifyAccessToken, preAuthorize(authorities.viewClients.code), removeUnverifiedMail );
router.route('/active-staff').get( verifyAccessToken, countActiveStaff );
router.route('/reset-pw').put( resetPassword );
router.route('/status').put( verifyAccessToken, preAuthorize(authorities.activateDeactiveteAccount.code), status );
router.route('/search/page/:pageNumber').get( verifyAccessToken, preAuthorize(authorities.viewStaff.code), paginateFetch );
router.route('/query').get( verifyAccessToken, preAuthorize(authorities.viewStaff.code), search );
router.route('/all').get( verifyAccessToken, preAuthorize(authorities.viewStaff.code), findAll );
router.route('/roles/update').put( verifyAccessToken, preAuthorize(authorities.updateStaffRoles.code), updateStaffRoles );
router.route('/search').get( verifyAccessToken, preAuthorize(authorities.staffSearch.code), findByEmail );
router.route('/dashboard').get( verifyAccessToken, dashboardInfo );
router.route('/profile/pw/update').put( verifyAccessToken, updatePassword );
router.route('/profile/info/update').put( verifyAccessToken, validate(personal_info_schema), updatePersonalInfo );
router.route('/profile/email/update/:nano_id').get( verifyAccessToken, updateEmail );
router.route('/profile/email/update').put( verifyAccessToken, validate(email_schema), markEmailForUpdate );
router.route('/profile/search/:id').get( verifyAccessToken, preAuthorize(authorities.viewStaffProfile.code), findByIdWithAuths );
router.route('/search/:id').get( verifyAccessToken, preAuthorize(authorities.staffSearch.code), findById );
router.route('/active/init/:pageSize').get( verifyAccessToken, preAuthorize(authorities.viewStaff.code), activeStaffPageInit );

module.exports = router;
