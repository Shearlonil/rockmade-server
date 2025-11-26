const express = require('express');
const router = express.Router();

const validate = require('../middleware/schemer-validator');
const { verifyAccessToken } = require('../middleware/jwt');
const { authorities } = require('../utils/default-entries');
const schema = require('../yup-schemas/course-schema');
const preAuthorize = require('../middleware/verify-authorities');
const courseService = require('../api-services/course-service');
const { routePositiveNumberMiscParamSchema } = require('../yup-schemas/request-params');

const createGolfCourse = async (req, res) => {
    try {
        await courseService.createGolfCourse(req.whom.id, req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};
const findById = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.params.id);
        res.status(200).json( await courseService.findById(req.params.id) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const findAllActiveGolfCoursesForGame = async (req, res) => {
    try {
        res.status(200).json(await courseService.findAllActiveGolfCoursesForGame());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const findAllActiveGolfCoursesForReg = async (req, res) => {
    try {
        res.status(200).json(await courseService.findAllActiveGolfCoursesForGame());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const activeCoursesPageInit = async (req, res) => {
    try {
        if(!req.whom.roles || req.whom.roles.length < 1){
            res.sendStatus(404);
        }
        res.status(200).json(await courseService.activeCoursesPageInit());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const inactiveCoursesPageInit = async (req, res) => {
    try {
        if(!req.whom.roles || req.whom.roles.length < 1){
            res.sendStatus(404);
        }
        res.status(200).json(await courseService.inactiveCoursesPageInit());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

router.route('/create').post( verifyAccessToken, validate(schema), preAuthorize(authorities.createCourse.code), createGolfCourse );
router.route('/active/all').get( verifyAccessToken, findAllActiveGolfCoursesForGame );
router.route('/onboarding/active/all').get( findAllActiveGolfCoursesForReg );
router.route('/active/init').get( verifyAccessToken, activeCoursesPageInit );
router.route('/inactive/init').get( verifyAccessToken, inactiveCoursesPageInit );
router.route('/search/:id').get( verifyAccessToken, findById );

module.exports = router;