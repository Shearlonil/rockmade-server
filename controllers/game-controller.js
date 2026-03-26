const express = require('express');
const router = express.Router();
const { isAfter } = require('date-fns');

const { verifyAccessToken } = require('../middleware/jwt');
const { 
    schema, 
    updateSchema, 
    spicesUpdateSchema, 
    addPlayerSchema, 
    playerScoresSchema, 
    playerContestScoresSchema, 
    playerGroupChangeSchema,
    playersGroupSwapSchema,
    playerRemovalSchema} = require('../yup-schemas/game-schema');
const validate = require('../middleware/schemer-validator');
const { findSubById } = require('../api-services/client-service');
const gameService = require('../api-services/game-service');
const { routePositiveNumberMiscParamSchema, routeStringMiscParamSchema } = require('../yup-schemas/request-params');
const { decrypt } = require('../utils/crypto-helper');

const findOngoingRoundById = async (req, res) => {
    try {
        // id passed is nano_id
        routeStringMiscParamSchema.validateSync(req.params.nano_id);
        res.status(200).json(await gameService.findOngoingRoundById(req.params.nano_id));
    } catch (error) {
        return res.status(404).json({'message': error.message});
    }
};

const findGameHistoryById = async (req, res) => {
    try {
        // id passed is nano_id
        routeStringMiscParamSchema.validateSync(req.params.nano_id);
        res.status(200).json(await gameService.findGameHistoryById(req.params.nano_id));
    } catch (error) {
        return res.status(404).json({'message': error.message});
    }
};

const userHistoryGames = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.query.page_size);
        routeStringMiscParamSchema.validateSync(req.query.player_id);
        routeStringMiscParamSchema.validateSync(req.query.cursor);
        const game_group_id = decrypt(req.query.cursor);
        res.status(200).json(await gameService.userHistoryGames(req.query.player_id, game_group_id, req.query.page_size));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const userHistoryGamesSearch = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.query.queryStr);
        routePositiveNumberMiscParamSchema.validateSync(req.query.page_size);
        routeStringMiscParamSchema.validateSync(req.query.cursor);
        routeStringMiscParamSchema.validateSync(req.query.player_id);
        const game_group_id = decrypt(req.query.cursor);
        res.status(200).json(await gameService.userHistoryGamesSearch(req.query.player_id, game_group_id, req.query.page_size, req.query.queryStr));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const createGame = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        const client = await findSubById(id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.createGame(id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updateGame = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        const client = await findSubById(id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.updateGame(id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const delOngoingRound = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        const client = await findSubById(id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        await gameService.delOngoingRound(id, req.params.id)
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const addPlayers = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        const client = await findSubById(id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.addPlayers(req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updatePlayerGroup = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        const client = await findSubById(id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.updatePlayerGroup(id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const removePlayer = async (req, res) => {
    // NOTE: only game creator can delete a player
    try {
        const id = decrypt(req.whom.id);
        const client = await findSubById(id);
        if(id == req.body.player_id){
            throw new Error("Invalid Operation!");
        }
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.removePlayer(id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const swapPlayers = async (req, res) => {
    try {
        await gameService.swapPlayers(req.body)
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updateGroupSize = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.body.game_id);
        routePositiveNumberMiscParamSchema.validateSync(req.body.group_size);
        res.status(200).json(await gameService.updateGroupSize(req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updateGroupScores = async (req, res) => {
    try {
        res.status(200).json(await gameService.updateGroupScores(req.params.nano_id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updateGroupContestScores = async (req, res) => {
    try {
        res.status(200).json(await gameService.updateGroupContestScores(req.params.id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updateGameSpices = async (req, res) => {
    try {
        const id = decrypt(req.whom.id);
        const client = await findSubById(id);
        if(isAfter(new Date(), new Date(client.sub_expiration).setHours(23, 59, 59, 0))){
            throw new Error("Account doesn't support feature. Please subscribe");
        }
        res.status(200).json(await gameService.updateGameSpices(id, req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

router.route('/rounds/ongoing/:nano_id').get( verifyAccessToken, findOngoingRoundById );
router.route('/rounds/history/:nano_id').get( verifyAccessToken, findGameHistoryById );
router.route('/rounds/ongoing/:nano_id/players/add').post( verifyAccessToken, validate(addPlayerSchema), addPlayers );
router.route('/rounds/ongoing/player/remove').put( verifyAccessToken, validate(playerRemovalSchema), removePlayer );
router.route('/rounds/ongoing/player/group/change').put( verifyAccessToken, validate(playerGroupChangeSchema), updatePlayerGroup );
router.route('/rounds/ongoing/:nano_id/players/group/scores').post( verifyAccessToken, validate(playerScoresSchema), updateGroupScores );
router.route('/rounds/ongoing/:id/players/group/contest/scores').post( verifyAccessToken, validate(playerContestScoresSchema), updateGroupContestScores );
router.route('/users/rounds/history').get( verifyAccessToken, userHistoryGames );
router.route('/users/rounds/history/query').get( verifyAccessToken, userHistoryGamesSearch );
router.route('/create').post( verifyAccessToken, validate(schema), createGame );
router.route('/update').post( verifyAccessToken, validate(updateSchema), updateGame );
router.route('/:id/remove').post( verifyAccessToken, delOngoingRound );
router.route('/spices/update').post( verifyAccessToken, validate(spicesUpdateSchema), updateGameSpices );
router.route('/groups/update-size').put( verifyAccessToken, updateGroupSize );
router.route('/groups/players/swap').put( verifyAccessToken, validate(playersGroupSwapSchema), swapPlayers );

module.exports = router;