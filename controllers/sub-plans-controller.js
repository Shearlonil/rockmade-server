const express = require('express');
const router = express.Router();

const { verifyAccessToken } = require('../middleware/jwt');
const validate = require('../middleware/schemer-validator');
const subPlanService = require('../api-services/sub-plans-service');
const { decrypt } = require('../utils/crypto-helper');
const { subPlanSchema, newBenefitSchema, updateBenefitSchema } = require('../yup-schemas/sub-plans-schema');

const getMembershipPlans = async (req, res) => {
    try {
        res.status(200).json(await subPlanService.membershipPlans());
    } catch (error) {
        return res.status(404).json({'message': error.message});
    }
};

const changePopularPlan = async (req, res) => {
    try {
        const plan_id = decrypt(req.body.plan_id);
        await subPlanService.changePopularPlan(plan_id)
        res.sendStatus(200);
    } catch (error) {
        return res.status(404).json({'message': error.message});
    }
};

const updatePlan = async (req, res) => {
    try {
        res.status(200).json(await subPlanService.updatePlan(req.body));
    } catch (error) {
        return res.status(404).json({'message': error.message});
    }
};

const addPlanBenefit = async (req, res) => {
    try {
        res.status(200).json(await subPlanService.addPlanBenefit(req.body));
    } catch (error) {
        return res.status(404).json({'message': error.message});
    }
};

const removePlanBenefit = async (req, res) => {
    try {
        await subPlanService.removePlanBenefit(req.body)
        res.sendStatus(200);
    } catch (error) {
        return res.status(404).json({'message': error.message});
    }
};

const updatePlanBenefit = async (req, res) => {
    try {
        await subPlanService.updatePlanBenefit(req.body)
        res.sendStatus(200);
    } catch (error) {
        return res.status(404).json({'message': error.message});
    }
};

router.route('/membership/plans').get( verifyAccessToken, getMembershipPlans );
router.route('/membership/plans/update').put( verifyAccessToken, validate(subPlanSchema), updatePlan );
router.route('/membership/plans/desc/update').put( verifyAccessToken, validate(updateBenefitSchema), updatePlanBenefit );
router.route('/membership/plans/desc/remove').put( verifyAccessToken, validate(updateBenefitSchema), removePlanBenefit );
router.route('/membership/plans/desc/add').post( verifyAccessToken, validate(newBenefitSchema), addPlanBenefit );
router.route('/membership/plans/update/popular').put( verifyAccessToken, changePopularPlan );

module.exports = router;