const db = require('../config/entities-config');

const TermsAndAgreement = db.termsAndAgreement;

const get = async () => {
    return await TermsAndAgreement.findByPk(1);
}

const update = async (value) => {
    const terms = await TermsAndAgreement.findByPk(1);
    terms.value = value;
    return await terms.save();
}

module.exports = {
    get,
    update,
};