const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");

const validate = require('../middleware/schemer-validator');
const { authorities } = require('../utils/default-entries');
const preAuthorize = require('../middleware/verify-authorities');
const { verifyAccessToken, createStaffAccessToken } = require('../middleware/jwt');
const generateOTP = require('../utils/otp-generator');
const staffService = require('../api-services/staff-service');
const mailOtpService = require('../api-services/mail-otp-service');
const schema = require('../yup-schemas/staff-schema');
const { routeEmailParamSchema, routeStringMiscParamSchema, routePasswordParamSchema, routePositiveNumberMiscParamSchema, routeBooleanParamSchema } = require('../yup-schemas/request-params');

const findById = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json(await staffService.findById(req.params.id));
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
};

const findByIdWithCreator = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json(await staffService.findByIdWithCreator(req.params.id));
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

const myProfile = async (req, res) => {
    try {
        // client not allowed to view staff profile
        if(req.whom.type){
            res.sendStatus(403);
        }else {
            res.status(200).json(await staffService.findById(req.whom.id));
        }
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
};

const findAll = async (req, res) => {
    try {
        res.status(200).json(await staffService.findAll());
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
}

const listStaff = async (req, res) => {
    // endpoint will receive an object of form {limit, offset, status}. limit and offset are for Sequelize while status represents active/non active
    // validate req.body
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.body.limit);
        routePositiveNumberMiscParamSchema.validateSync(req.body.offset);
        // routeEmailParamSchema.validateSync(req.body.email);
        if(req.whom.type) {
            throw new Error("Not Allowed");
        }
        res.status(200).json(await staffService.listStaff(req.body));
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
}

const updateStaffRoles = async (req, res) => {
    // endpoint will receive an array of roles in number format
    try {
        // account cannot edit itself
        if(req.whom.id === req.body.staff_id) {
            res.sendStatus(401);
        }
        /*  updater cannot add authorities they don't have
            Algorithm returns false if a role which the current user doesn't have is found in the list of roles to be added to edited/updated account   
            returns undefined for empty list or truth case (supplied role list contains roles present in the current user making changes or updating account    */
        const result = req.body.authorities.map( role => req.whom.roles.includes(role) ).find(val => val === false);
        if(result === false) {
            res.sendStatus(401); // Unauthorized
        }
        res.status(200).json(await staffService.updateAuthorities(req.body));
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
}

const changeStaffStatus = async (req, res) => {
    // endpoint will receive an object of form {staff_id, status}.
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.body.staff_id);
        routeBooleanParamSchema.validateSync(req.body.status);
        if(req.whom.type) {
            // client cannot edit staff account
            throw new Error("Not Allowed");
        }
        res.status(200).json( await staffService.changeStaffStatus(req.body));
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
        await staffService.register(req.body, req.whom.id);

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
            subject: 'Autogenerated Password',
            text: `This message is from The Advancement Place, please use the autogenerated password ${oneTimePass} to login. You may change the password if you like. `
        };
        
        // Send the email
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                // on error sending mail, delete account created earlier
                await staffService.deleteAccount(email);
                res.status(500).json({'message': error.response });
            } else {
                res.status(201).json({'message': 'Account creation successful'});
            }
        });
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const update = async (req, res) => {
    try {
        // find staff from db using id in request parameter
        const staff = await staffService.findById(req.whom.id);
        if(!staff) {
            return res.status(400).json({'message': "Not Found"});
        }

        const updatedStaff = await staffService.update(req.whom.id, req.body);
        // create jwt access token
        const accessToken = createStaffAccessToken(updatedStaff);
        //  Because of cors, only some of the headers will be accessed by the browser. [Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma]
        res.setHeader("Access-Control-Expose-Headers", "X-Suggested-Filename, authorization");
        res.setHeader('authorization', 'Bearer ' + accessToken);
        res.status(200).json({'message': 'Account update successful'});
    } catch (error) {
        cleanUpFileUpload(req.file);
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
        // find staff from db using id in request parameter
        const staff = await staffService.findForPassWord(req.whom.id);
        if(!staff) {
            return res.status(400).json({'message': "Profile not Found"});
        }
        // check if current password is correct
        // if match, then compare password
        const match = await bcrypt.compare(current_pw, staff.pw);
        if(match) {
            await staffService.updatePassword(req.whom.id, new_pw);
            res.status(200).json({'message': 'Password update successful'});
        }else {
            res.status(401).json({'message': 'Invalid password'});
        }
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
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                res.status(500).json({'message': error.response });
            } else {
                res.status(200).json({'message': 'Password reset successfull\nPlease check your email for new password.\nIf not found in your inbox, please check your spam'});
            }
        });
    } catch (error) {
        return res.status(400).json({'message': error.message});
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
    try {
        res.status(200).json(await staffService.countActiveStaff());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const getAuthorities = async (req, res) => {
    res.status(200).json( await staffService.getAuthorities());
};

router.route('/register').post( verifyAccessToken, validate(schema), preAuthorize(authorities.addStaffAccount.code), registerStaff );
router.route('/auths').get( verifyAccessToken, preAuthorize(authorities.addStaffAccount.code), getAuthorities );
router.route('/unverified-mails').get( verifyAccessToken, countUnverifiedMails );
router.route('/unverified-mails/view').get( verifyAccessToken, preAuthorize(authorities.viewClients.code), getUnverifiedMails );
router.route('/unverified-mails/clear').get( verifyAccessToken, preAuthorize(authorities.viewClients.code), clearAllUnverifiedMails );
router.route('/unverified-mails/remove/:email').get( verifyAccessToken, preAuthorize(authorities.viewClients.code), removeUnverifiedMail );
router.route('/active-staff').get( verifyAccessToken, countActiveStaff );
router.route('/update').put( verifyAccessToken, validate(schema), update );
router.route('/update-pw').put( verifyAccessToken, updatePassword );
router.route('/reset-pw').put( resetPassword );
router.route('/status').put( verifyAccessToken, preAuthorize(authorities.activateDeactiveteAccount.code), changeStaffStatus );
router.route('/list').get( verifyAccessToken, preAuthorize(authorities.viewStaff.code), listStaff );
router.route('/all').get( verifyAccessToken, preAuthorize(authorities.viewStaff.code), findAll );
router.route('/update-roles').put( verifyAccessToken, preAuthorize(authorities.updateStaffRoles.code), updateStaffRoles );
router.route('/search').get( verifyAccessToken, preAuthorize(authorities.staffSearch.code), findByEmail );
router.route('/profile').get( verifyAccessToken, myProfile );
router.route('/search/:id').get( verifyAccessToken, preAuthorize(authorities.staffSearch.code), findById );
router.route('/profile/search/:id').get( verifyAccessToken, preAuthorize(authorities.staffSearch.code), findByIdWithCreator );

module.exports = router;
