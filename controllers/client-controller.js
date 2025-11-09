const express = require('express');
const router = express.Router();
const nodemailer = require("nodemailer");
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { encode } = require('blurhash');
const sharp = require("sharp");

const { verifyAccessToken, verifyOTPtoken, createClientAccessToken, createRefreshToken } = require('../middleware/jwt');
const validate = require('../middleware/schemer-validator');
const multerImgUpload = require('../utils/multer-img-upload');
const schema = require('../yup-schemas/user-schema');
const otpMailService = require('../api-services/mail-otp-service');
const { routeEmailParamSchema, routePositiveNumberMiscParamSchema } = require('../yup-schemas/request-params');

const findById = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json(await cilentService.findById(req.params.id));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const myProfile = async (req, res) => {
    try {
        res.status(200).json(await cilentService.findById(req.whom.id));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const findByEmail = async (req, res) => {
    try {
        routeEmailParamSchema.validateSync(req.body.email);
        res.status(200).json(await cilentService.findByEmail(email));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const register = async (req, res) => {
    const mail_otp = await otpMailService.findByEmail(req.body.email);
    const fileExtension = '';
    if(mail_otp){
        try {
            const clientObj = req.body;
            verifyOTPtoken(clientObj, mail_otp.otp);
            // check if submitted otp is same as db otp
            if(clientObj.decodedOTP !== clientObj.otp){
                cleanUpFileUpload(req.file);
                return res.status(400).json({'message': 'OTP verification failed.\nPlease request a new OTP and continue'});
            }
            if(req.file){
                clientObj.dp = true;
                // get file extension
                fileExtension = path.extname(path.join(__dirname, "..", "images", req.file.filename));
            }else {
                clientObj.dp = false;
            }
            // create account
            const client = await cilentService.register(clientObj);
            // if dp is available, rename file
            if(req.file) {
                // move and rename dp name to client id
                await fsPromises.rename(path.join(__dirname, "..", "images", req.file.filename), path.join(__dirname, "..", "dp-upload", client.id + fileExtension));
                const encodedHash = await encodeImageToBlurhash(path.join(__dirname, "..", "dp-upload", client.id + fileExtension));
                await createWebP(path.join(__dirname, "..", "dp-upload", client.id + fileExtension));
            }
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
            res.status(201).json({'message': 'Account Creation successful'});
        } catch (error) {
            cleanUpFileUpload(req.file);
            res.status(400).json({'message': error.message});
        }
    }else {
        cleanUpFileUpload(req.file);
        res.status(400).json({'message': "No associated mail found with otp."});
    }    
};

const updateEmail = async (req, res) => {
    const email = req.body.email;
    try {
        // First thing First: validate email in request body
        routeEmailParamSchema.validateSync(email);
        // find client from db using id in request parameter
        const client = await cilentService.findById(req.whom.id);
        if(!client) {
            return res.status(400).json({'message': "Not Found"});
        }
        cilentService.updateEmail(clientID, email);
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
        const client = await cilentService.findById(req.whom.id);
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
        const client = await cilentService.findForPassWord(req.whom.id);
        if(!client) {
            return res.status(400).json({'message': "Not Found"});
        }
        // check if current password is correct
        // if match, then compare password
        const match = await bcrypt.compare(current_pw, client.pw);
        if(match) {
            await cilentService.updatePassword(req.whom.id, new_pw);
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
        const pw = await cilentService.resetPassword(req.body);

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

// PRIVATE METHODS
'=================================='
const encodeImageToBlurhash = async img => {
    /*  ref: https://blog.opinly.ai/image-optimisation-with-sharp-in-nodejs/
        https://www.digitalocean.com/community/tutorials/how-to-process-images-in-node-js-with-sharp
        https://hamon.in/blog/blurhash/
        https://harshpathak.hashnode.dev/creating-mesmerizing-visual-experiences-a-beginners-guide-to-image-blurring-with-blurhash
    */
    const { data, info } = await sharp(img).ensureAlpha().raw().toBuffer({
        resolveWithObject: true,
    });

    const encoded = encode(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
        4,
        4
    );

    return {
        hash: encoded,
        height: info.height,
        width: info.width,
    };
};

const resizeImage = async (sharpImage) => {
    /*  ref: https://blog.opinly.ai/image-optimisation-with-sharp-in-nodejs/
    */
    const metadata = await sharpImage.metadata();

    // Calculate the maximum dimensions
    const maxWidth = 16383;
    const maxHeight = 16383;

    if (!metadata.width) {
        throw new Error("No metadata width found for image");
    }

    if (!metadata.height) {
        throw new Error("No metadata height found for image");
    }

    // Determine whether resizing is necessary
    const needsResize = metadata.width > maxWidth || metadata.height > maxHeight;

    let resizedImage = sharpImage;

    if (needsResize) {
        // Calculate the new size maintaining the aspect ratio
        const aspectRatio = metadata.width / metadata.height;
        let newWidth = maxWidth;
        let newHeight = maxHeight;

        if (metadata.width > metadata.height) {
        // Landscape or square image: scale by width
        newHeight = Math.round(newWidth / aspectRatio);
        } else {
        // Portrait image: scale by height
        newWidth = Math.round(newHeight * aspectRatio);
        }

        // Resize the image before converting to WebP
        resizedImage = sharpImage.resize(newWidth, newHeight);
    }

    return resizedImage;
}

const createWebP = async (imageArray) => {
    const sharpImage = sharp(imageArray);

    const resizedImage = await resizeImage(sharpImage);

    const webP = await resizedImage.webp().toBuffer();

    return webP;
};

const cleanUpFileUpload = async (file) => {
    // possibility of successful file upload
    // handle file delete in case of multer file upload
    if(file && existsSync(path.join(__dirname, "..", "images", file.filename)) ){
        await fsPromises.unlink(path.join(__dirname, "..", "images", file.filename));
    }
};

router.route('/register').post(multerImgUpload, validate(schema), register );

module.exports = router;