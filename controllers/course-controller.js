const express = require('express');
const router = express.Router();

const validate = require('../middleware/schemer-validator');
const { verifyAccessToken } = require('../middleware/jwt');
const { authorities } = require('../utils/default-entries');
const { schema, courseUpdate, courseHoleCountUpdateSchema, courseHoleUpdateSchema } = require('../yup-schemas/course-schema');
const preAuthorize = require('../middleware/verify-authorities');
const courseService = require('../api-services/course-service');
const { routePositiveNumberMiscParamSchema, routeStringMiscParamSchema, routeBooleanParamSchema } = require('../yup-schemas/request-params');
const { decrypt } = require('../utils/crypto-helper');

const createGolfCourse = async (req, res) => {
    try {
        await courseService.createGolfCourse(req.whom.id, req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

// for changing number of holes in a course. Either was 18 and now updating to 9 holes or was 9 and now updating to 18
const updateCourseHoleCount = async (req, res) => {
    try {
        res.status(200).json(await courseService.updateCourseHoleCount(req.body));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

// for updating values (par and hcp) of a hole in a course
const updateCourseHole = async (req, res) => {
    try {
        await courseService.updateCourseHole(req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const updateCourse = async (req, res) => {
    try {
        await courseService.updateCourse(req.body);
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

const search = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.query.str);
        routeBooleanParamSchema.validateSync(req.query.status);
        res.status(200).json( await courseService.search(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const paginateFetch = async (req, res) => {
    try {
        routePositiveNumberMiscParamSchema.validateSync(req.query.page);
        routePositiveNumberMiscParamSchema.validateSync(req.query.pageSize);
        routeBooleanParamSchema.validateSync(req.query.status);
        res.status(200).json( await courseService.paginateFetch(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
}

const findAllActive = async (req, res) => {
    try {
        res.status(200).json(await courseService.findAllActive());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const gameCourseSearch = async (req, res) => {
    try {
        const mode = decrypt(req.whom.mode);
        if(mode !== '1'){
            return res.sendStatus(404);
        }
        routeStringMiscParamSchema.validateSync(req.query.str);
        res.status(200).json(await courseService.gameCourseSearch(req.query.str));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const limitGameCourseSearch = async (req, res) => {
    try {
        const mode = decrypt(req.whom.mode);
        if(mode !== '1'){
            return res.sendStatus(404);
        }
        routePositiveNumberMiscParamSchema.validateSync(req.params.pageSize);
        res.status(200).json(await courseService.limitGameCourseSearch(req.params.pageSize));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

// finding golf courses for player registration..... Hence, no need for token verification for this end-point
const onboardingCoursesInit = async (req, res) => {
    try {
        res.status(200).json(await courseService.onboardingCoursesInit());
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

// finding golf courses for player registration..... Hence, no need for token verification for this end-point
const onboardingCourseSearch = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.query.str);
        res.status(200).json( await courseService.onboardingCourseSearch(req.query) );
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const activeCoursesPageInit = async (req, res) => {
    try {
        // TODO: delete comments
        // Only Staff memebers are allowed to view this end-point
        // const mode = decrypt(req.whom.mode);
        // if(mode !== '0'){
        //     return res.sendStatus(404);
        // }
        routePositiveNumberMiscParamSchema.validateSync(req.params.pageSize);
        res.status(200).json(await courseService.activeCoursesPageInit(req.params.pageSize));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const inactiveCoursesPageInit = async (req, res) => {
    try {
        const mode = decrypt(req.whom.mode);
        if(mode !== '0'){
            return res.sendStatus(404);
        }
        routePositiveNumberMiscParamSchema.validateSync(req.params.pageSize);
        res.status(200).json(await courseService.inactiveCoursesPageInit(req.params.pageSize));
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

const status = async (req, res) => {
    try {
        routeStringMiscParamSchema.validateSync(req.body.id);
        routeBooleanParamSchema.validateSync(req.body.status);
        await courseService.status(req.body);
        res.sendStatus(200);
    } catch (error) {
        return res.status(400).json({'message': error.message});
    }
};

router.route('/create').post( verifyAccessToken, validate(schema), preAuthorize(authorities.createCourse.code), createGolfCourse );
router.route('/update').post( verifyAccessToken, validate(courseUpdate), preAuthorize(authorities.updateCourse.code), updateCourse );
router.route('/holes/update').post( verifyAccessToken, validate(courseHoleCountUpdateSchema), preAuthorize(authorities.updateCourse.code), updateCourseHoleCount );
router.route('/hole/update').post( verifyAccessToken, validate(courseHoleUpdateSchema), preAuthorize(authorities.updateCourse.code), updateCourseHole );
router.route('/status').put( verifyAccessToken, preAuthorize(authorities.deleteActivateCourse.code), status );
router.route('/active/all').get( verifyAccessToken, findAllActive );
router.route('/games/init/:pageSize').get( verifyAccessToken, limitGameCourseSearch );
router.route('/games/search').get( verifyAccessToken, gameCourseSearch );
router.route('/onboarding/active').get( onboardingCoursesInit );
router.route('/onboarding/query').get( onboardingCourseSearch );
router.route('/active/init/:pageSize').get( verifyAccessToken, activeCoursesPageInit );
router.route('/inactive/init/:pageSize').get( verifyAccessToken, inactiveCoursesPageInit );
router.route('/search/:id').get( verifyAccessToken, findById );
router.route('/search/page/:pageNumber').get( verifyAccessToken, paginateFetch );
router.route('/query').get( verifyAccessToken, search );

module.exports = router;