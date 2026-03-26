const express = require('express');
const router = express.Router();

const { verifyAccessToken } = require('../middleware/jwt');
const validate = require('../middleware/schemer-validator');

const initializeMembershipTransaction = async (req, res) => {
    try {
        return res.status(200).json({'message': 'OTP sent'});
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const initializeTrainingTransaction = async (req, res) => {
    try {
        return res.status(200).json({'message': 'OTP sent'});
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

router.route('/membership/initialize').post( verifyAccessToken, initializeMembershipTransaction );
router.route('/training/initialize').post( verifyAccessToken, initializeTrainingTransaction );

module.exports = router;