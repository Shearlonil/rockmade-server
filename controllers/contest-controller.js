const express = require('express');
const router = express.Router();

const { verifyAccessToken } = require('../middleware/jwt');
const { authorities } = require('../utils/default-entries');
const { routeStringMiscParamSchema, routePositiveNumberMiscParamSchema, routeBooleanParamSchema } = require('../yup-schemas/request-params');
const preAuthorize = require('../middleware/verify-authorities');
const contestService = require('../api-services/contest-service');
const validate = require('../middleware/schemer-validator');
const schema = require('../yup-schemas/contests-holes-update-schema');
const { decrypt } = require('../utils/crypto-helper');

const findById = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json( await contestService.findById(req.params.id) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const create = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.params.name);
        res.status(200).json(await contestService.create(req.whom.id, req.params.name));
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

// for adding contests to holes (spicing up games)
const updateHoles = async (req, res) => {
    try {
        await contestService.updateHoles(req.body.contests);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const removeHole = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.body.contest_id);
        routePositiveNumberMiscParamSchema.validateSync(req.body.hole_id);
        await contestService.removeHole(req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const findAllActive = async (req, res) => {
    try {
        res.status(200).json(await contestService.findAllActive());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const activeContestsPageInit = async (req, res) => {
    try {
        const mode = decrypt(req.whom.mode);
        if(mode !== '0'){
            return res.sendStatus(404);
        }
        routePositiveNumberMiscParamSchema.validateSync(req.params.pageSize);
        res.status(200).json(await contestService.activeContestsPageInit(req.params.pageSize));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const search = async (req, res) => {
    try {
        const mode = decrypt(req.whom.mode);
        if(mode !== '0'){
            return res.sendStatus(404);
        }
        routeStringMiscParamSchema.validateSync(req.query.str);
        routeBooleanParamSchema.validateSync(req.query.status);
        res.status(200).json( await contestService.search(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const paginateFetch = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.query.page);
        routePositiveNumberMiscParamSchema.validateSync(req.query.pageSize);
        routeBooleanParamSchema.validateSync(req.query.status);
        res.status(200).json( await contestService.paginateFetch(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

router.route('/create/:name').post( verifyAccessToken, preAuthorize(authorities.createContest.code), create );
router.route('/update').put( verifyAccessToken, preAuthorize(authorities.updateContest.code), update );
router.route('/holes/update').put( verifyAccessToken, validate(schema), preAuthorize(authorities.updateContest.code), updateHoles );
router.route('/hole/remove').put( verifyAccessToken, preAuthorize(authorities.updateContest.code), removeHole );
router.route('/status').put( verifyAccessToken, preAuthorize(authorities.deleteActivateContest.code), status );
router.route('/active/init/:pageSize').get( verifyAccessToken, activeContestsPageInit );
router.route('/active/all').get( findAllActive );
router.route('/search/:id').get( verifyAccessToken, findById );
router.route('/search/page/:pageNumber').get( verifyAccessToken, paginateFetch );
router.route('/query').get( verifyAccessToken, search );

module.exports = router;