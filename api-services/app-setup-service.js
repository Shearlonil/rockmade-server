const db = require('../config/entities-config');
const bcrypt = require('bcryptjs');

const { bora, authorities } = require('../utils/default-entries');

const Staff = db.staff;
const Authority = db.staffAuths;
const terms = db.termsAndAgreement;
const Country = db.countries;

const setUp = async () => {
    try {
        await db.sequelize.transaction( async (t) => {
            const admin = await createDefaultAdmin(t);
            await createAuths(t, admin);
            // create default Terms and Conditions
            const arr = [
                {
                    attributes: { bold: true },
                    insert: "Advertising Terms of use" 
                },
                {
                    insert: "\n",
                }
            ];
            await terms.create({value: arr}, { transaction: t });
            await Country.create({name: "Nigeria", status: true, creator_id: admin.id}, { transaction: t });
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const createDefaultAdmin = async (t) => {
    const { fname, lname, phone, email, sex, acc_creator } = bora;
    // encrypt password
    const hashedPwd = await bcrypt.hash('123456', 12);
    return await Staff.create(
        { fname, lname, phone, pw: hashedPwd, email, status: true, sex, acc_creator },
        { transaction: t }
    );
};

const createAuths = async (t, admin) => {
    for (const key in authorities) {
        const { name, code, desc } = authorities[key];
        const auth = await Authority.create({ name, code, desc }, { transaction: t });
        await admin.addAuthority(auth, { transaction: t });
    }
}

module.exports = setUp;