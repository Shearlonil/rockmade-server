const express = require('express');
const router = express.Router();
const { isAfter } = require('date-fns');

const { verifyAccessToken } = require('../middleware/jwt');
const {schema, updateSchema, spicesUpdateSchema, addPlayerSchema} = require('../yup-schemas/game-schema');
const validate = require('../middleware/schemer-validator');
const { findById } = require('../api-services/client-service');
const gameService = require('../api-services/game-service');
const { routePositiveNumberMiscParamSchema } = require('../yup-schemas/request-params');

const findOngoingRoundById = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json(await gameService.findOngoingRoundById(req.params.id));
    } catch (error) {
        return res.status(404).json({'message': error.message});
    }
};

const rawFindOngoingRoundById = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json(await gameService.rawFindOngoingRoundById(req.params.id));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const createGame = async (req, res) => {
    try {
        const client = await findById(req.whom.id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.createGame(req.whom.id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updateGame = async (req, res) => {
    try {
        const client = await findById(req.whom.id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.updateGame(req.whom.id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const delOngoingRound = async (req, res) => {
    try {
        const client = await findById(req.whom.id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        await gameService.delOngoingRound(req.whom.id, req.params.id)
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const addPlayers = async (req, res) => {
    try {
        const client = await findById(req.whom.id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.addPlayers(req.whom.id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const removePlayer = async (req, res) => {
    try {
        const client = await findById(req.whom.id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.updateGame(req.whom.id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updateGameSpices = async (req, res) => {
    try {
        const client = await findById(req.whom.id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.updateGameSpices(req.whom.id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

router.route('/rounds/ongoing/raw/:id').get( verifyAccessToken, rawFindOngoingRoundById );
router.route('/rounds/ongoing/:id').get( verifyAccessToken, findOngoingRoundById );
router.route('/rounds/ongoing/:id/players/add').post( verifyAccessToken, validate(addPlayerSchema), addPlayers );
router.route('/rounds/ongoing/:id/player/remove').put( verifyAccessToken, removePlayer );
router.route('/create').post( verifyAccessToken, validate(schema), createGame );
router.route('/update').post( verifyAccessToken, validate(updateSchema), updateGame );
router.route('/:id/remove').post( verifyAccessToken, delOngoingRound );
router.route('/spices/update').post( verifyAccessToken, validate(spicesUpdateSchema), updateGameSpices );

module.exports = router;