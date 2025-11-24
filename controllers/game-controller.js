const express = require('express');
const router = express.Router();
const { isAfter } = require('date-fns');

const { verifyAccessToken } = require('../middleware/jwt');
const schema = require('../yup-schemas/game-schema');
const validate = require('../middleware/schemer-validator');
const { findById } = require('../api-services/client-service');
const gameService = require('../api-services/game-service');

const createGame = async (req, res) => {
    try {
        const client = await findById(req.whom.id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        await gameService.createGame(req.whom.id, req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

router.route('/create').post( verifyAccessToken, validate(schema), createGame );

module.exports = router;