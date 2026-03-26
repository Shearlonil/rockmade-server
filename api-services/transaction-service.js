const db = require('../config/entities-config');

const SubscriptionPlans = db.subscriptionPlans;
const TrainingPlans = db.trainingPlans;

const initializeMembershipTransaction = async id => {
    return await SubscriptionPlans.findByPk(id, {
        attributes: ['id', 'fname', 'lname', 'phone', 'email', 'sex', 'acc_creator', 'status', 'createdAt'],
    });
};

const initializeTrainingTransaction = async id => {
    return await TrainingPlans.findByPk(id, {
        attributes: ['id', 'fname', 'lname', 'phone', 'email', 'sex', 'acc_creator', 'status', 'createdAt'],
    });
};

module.exports = {
    initializeMembershipTransaction,
    initializeTrainingTransaction,
};