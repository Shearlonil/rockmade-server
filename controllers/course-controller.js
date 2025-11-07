const express = require('express');
const router = express.Router();

const validate = require('../middleware/schemer-validator');
const { verifyAccessToken } = require('../middleware/jwt');
const { authorities } = require('../utils/default-entries');
const schema = require('../yup-schemas/course-schema');
const preAuthorize = require('../middleware/verify-authorities');
const courseService = require('../api-services/course-service');

const createGolf = async (req, res) => {
    try {
        await courseService.createGolfCourse(req.whom.id, req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

router.route('/create').post( verifyAccessToken, validate(schema), preAuthorize(authorities.createCourse.code), createGolf );

module.exports = router;