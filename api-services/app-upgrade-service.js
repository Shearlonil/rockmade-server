const db = require('../config/entities-config');
const { nanoid } = require('nanoid');

const { membership_plans } = require('../utils/default-entries');

const Country = db.countries;
const Contests = db.contests;
const Courses = db.courses;
const Games = db.games;
const Staff = db.staff;
const SubscriptionPlan = db.subscriptionPlans;
const SubPlanBenefits = db.subPlanBenefits;
const TrainingPlan = db.trainingPlans;
const Users = db.users;

const upgrade = async () => {
    // find all countries
    const countries = await Country.findAll();
    const contests = await Contests.findAll();
    const courses = await Courses.findAll();
    const games = await Games.findAll();
    const staff = await Staff.findAll();
    const subPlans = await SubscriptionPlan.findAll();
    const training = await TrainingPlan.findAll();
    const players = await Users.findAll();

    const all = [...countries, ...contests, ...courses, ...games, ...staff, ...subPlans, ...training, ...players];
    await db.sequelize.transaction( async (t) => {
        for(const model of all){
            model.nano_id = nanoid();
            await model.save({transaction: t});
        }
        for (const el of membership_plans) {
            const plan = await SubscriptionPlan.create({ nano_id: nanoid(), name: el.name, amount: el.amount, duration_months: el.duration, desc: el.desc, popular: el.popular }, { transaction: t });
            for (const benefit of el.benefits) {
                await SubPlanBenefits.create({ desc: benefit, plan_id: plan.id }, { transaction: t });
            }
        }
    });
};

module.exports = upgrade;