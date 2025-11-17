const express = require('express');
const router = express.Router();

const validate = require('../middleware/schemer-validator');
const { verifyAccessToken } = require('../middleware/jwt');
const { authorities } = require('../utils/default-entries');
const schema = require('../yup-schemas/course-schema');
const preAuthorize = require('../middleware/verify-authorities');
const courseService = require('../api-services/course-service');

const createGolfCourse = async (req, res) => {
    try {
        await courseService.createGolfCourse(req.whom.id, req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

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

router.route('/create').post( verifyAccessToken, validate(schema), preAuthorize(authorities.createCourse.code), createGolfCourse );
router.route('/active/all').get( verifyAccessToken, findAllActiveGolfCoursesForGame );
router.route('/onboarding/active/all').get( findAllActiveGolfCoursesForReg );

module.exports = router;