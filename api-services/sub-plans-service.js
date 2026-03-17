const db = require('../config/entities-config');
const { QueryTypes } = db.sequelize;
const { subDays, addDays, format } = require('date-fns');

const SubscriptionPlans = db.subscriptionPlans;
const SubPlanBenefits = db.subPlanBenefits;
const TrainingPlans = db.trainingPlans;

const membershipPlans = async () => {
    return await SubscriptionPlans.findAll(
        { 
            include: [
                {
                    model: SubPlanBenefits,
                },
            ]
        }
    );
};

const updatePlan = async (data) => {
    try {
        const subPlan = await SubscriptionPlans.findByPk(data.id);
        if(subPlan){
            // then update subPlan plan to new id
            subPlan.name = data.name;
            subPlan.amount = data.amount;
            subPlan.duration_months = data.duration_months;
            subPlan.discount = data.discount;
            await subPlan.save();
        }else {
            throw new Error('Invalid Operation!.');
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
};

const changePopularPlan = async (plan_id) => {
    try {
        const popular = await SubscriptionPlans.findByPk(plan_id);
        if(popular){
            await db.sequelize.transaction( async (t) => {
                // change popular field for all plans to false
                await  db.sequelize.query(
                    `UPDATE sub_plans SET popular = false`,
                    {
                        type: QueryTypes.UPDATE, // Specify the query type
                        transaction: t,
                    }
                );
                // then update popular plan to new id
                popular.popular = true;
                await popular.save({ transaction: t });
            });
        }else {
            throw new Error('Invalid Operation!.');
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
};

module.exports = {
    membershipPlans,
    updatePlan,
    changePopularPlan,
};