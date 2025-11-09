const db = require('../config/entities-config');
const { Op } = require('sequelize');

const MailOTP = db.mailOTP;

const findByEmail = async email => {
    return await MailOTP.findOne({ where: { email } });
};

const saveOrUpdate = async (email, otp) => {
    return await MailOTP.upsert({ email, otp });
};

const remove = async email => {
    return await MailOTP.destroy({ where: { email } });
}

const count = async () => {
    return await MailOTP.count();
}

const findAll = async () => {
    return await MailOTP.findAll();
}

const clearAll = async () => {
    return await MailOTP.destroy({ 
        where: {
            id: {
                [Op.gt] : 0
            }
        }
    });
}

module.exports = {
    saveOrUpdate,
    findByEmail,
    remove,
    count,
    findAll,
    clearAll,
};