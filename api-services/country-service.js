const db = require('../config/entities-config');

const Country = db.countries;

const create = async (creator_id, name) => {
    try {
        await db.sequelize.transaction( async (t) => {
            await Country.create({ name, creator_id }, { transaction: t });
        } );
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const update = async (country) => {
    try {
        const { name, id } = country;
        const c = await Country.findByPk(id);
        if(c === null){
             throw new Error("Country not found");
        }
        await Country.update({ name }, {
            where: { id },
            returning: true,
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const status = async (country) => {
    try {
        const { status, id } = country;
        const c = await Country.findByPk(id);
        if(c === null){
             throw new Error("Country not found");
        }
        await Country.update({ status }, {
            where: { id },
            returning: true,
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

module.exports = {
    create,
    update,
    status,
};