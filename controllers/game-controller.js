const express = require('express');
const router = express.Router();

const { verifyAccessToken } = require('../middleware/jwt');
const schema = require('../yup-schemas/game-schema');
const validate = require('../middleware/schemer-validator');

const createGame = async (req, res) => {
    try {
        // Wait for 3 minutes (3 * 60 * 1000 milliseconds)
        setTimeout(() => {
            console.log("1 minutes have passed. Executing delayed code.");
            // Place the code you want to execute after the delay here
            res.sendStatus(200);
        }, 1 * 60 * 1000);
        
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

router.route('/create').post( verifyAccessToken, validate(schema), createGame );

module.exports = router;