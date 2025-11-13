const express = require('express');
const router = express.Router();

const validate = require('../middleware/schemer-validator');
const { verifyAccessToken } = require('../middleware/jwt');
const { authorities } = require('../utils/default-entries');
const preAuthorize = require('../middleware/verify-authorities');
const countryService = require('../api-services/country-service');
const { routeStringMiscParamSchema, routePositiveNumberMiscParamSchema, routeBooleanParamSchema } = require('../yup-schemas/request-params');

const create = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.params.name);
        await countryService.create(req.whom.id, req.params.name);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const status = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.body.id);
        routeBooleanParamSchema.validateSync(req.body.status);
        await countryService.status(req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const update = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.body.id);
        routeStringMiscParamSchema.validateSync(req.body.name);
        await countryService.update(req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

router.route('/create/:name').post( verifyAccessToken, preAuthorize(authorities.createCountry.code), create );
router.route('/update').put( verifyAccessToken, preAuthorize(authorities.updateCountry.code), update );
router.route('/status').put( verifyAccessToken, preAuthorize(authorities.deleteActivateCountry.code), status );

module.exports = router;