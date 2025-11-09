const express = require('express');
const router = express.Router();

const { verifyAccessToken } = require('../middleware/jwt');
const { authorities } = require('../utils/default-entries');
const preAuthorize = require('../middleware/verify-authorities');
const contestService = require('../api-services/contest-service');
const { routeStringMiscParamSchema, routePositiveNumberMiscParamSchema, routeBooleanParamSchema } = require('../yup-schemas/request-params');

const create = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.params.name);
        await contestService.create(req.whom.id, req.params.name);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const status = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.body.id);
        routeBooleanParamSchema.validateSync(req.body.status);
        await contestService.status(req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const update = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.body.id);
        routeStringMiscParamSchema.validateSync(req.body.name);
        await contestService.update(req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

router.route('/create/:name').post( verifyAccessToken, preAuthorize(authorities.createContest.code), create );
router.route('/update').put( verifyAccessToken, preAuthorize(authorities.updateContest.code), update );
router.route('/status').put( verifyAccessToken, preAuthorize(authorities.deleteActivateContest.code), status );

module.exports = router;