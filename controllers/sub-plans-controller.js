const express = require('express');
const router = express.Router();

const { verifyAccessToken } = require('../middleware/jwt');
const validate = require('../middleware/schemer-validator');
const subPlanService = require('../api-services/sub-plans-service');
const { decrypt } = require('../utils/crypto-helper');
const { subPlans, planBenefits } = require('../yup-schemas/sub-plans-schema');

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

router.route('/membership/plans').get( verifyAccessToken, getMembershipPlans );
router.route('/membership/plans/update').put( verifyAccessToken, validate(subPlans), updatePlan );
router.route('/membership/plans/desc/update').put( verifyAccessToken, validate(planBenefits), updatePlan );
router.route('/membership/plans/desc/remove').put( verifyAccessToken, validate(planBenefits), updatePlan );
router.route('/membership/plans/desc/add').put( verifyAccessToken, validate(planBenefits), updatePlan );
router.route('/membership/plans/update/popular').put( verifyAccessToken, changePopularPlan );

module.exports = router;