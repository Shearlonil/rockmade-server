const express = require('express');
const router = express.Router();

const { authorities } = require('../utils/default-entries');
const termsAndAgreementService = require('../api-services/terms-and-agreement-service');
const quillSchema = require('../json-schema/quill-schema');
const { verifyAccessToken } = require('../middleware/jwt');
const preAuthorize = require('../middleware/verify-authorities');

const Ajv =  require("ajv");
const ajv = new Ajv({allErrors: true});

const get = async (req, res) => {
    res.status(200).json(await termsAndAgreementService.get());
}

const set = async (req, res) => {
    try {
        const isValid = ajv.validate(quillSchema, req.body);
        if (!isValid) {
            throw new Error("Invalid format detected");
        }
        await termsAndAgreementService.update(req.body);
        res.sendStatus(200);
    } catch (error) {
        res.status(400).json({'message': error.message});
    }
}

router.route('/update').post( verifyAccessToken, preAuthorize(authorities.updateTermsAndAgreement.code), set );
router.route('/get').get( get );

module.exports = router;