const db = require('../config/entities-config');

const Contest = db.contests;

const create = async (creator_id, name) => {
    try {
        await db.sequelize.transaction( async (t) => {
            await Contest.create({ name, creator_id }, { transaction: t });
        } );
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const update = async (contest) => {
    try {
        const { name, id } = contest;
        const c = await Contest.findByPk(id);
        if(c === null){
             throw new Error("Contest not found");
        }
        await Contest.update({ name }, {
            where: { id },
            returning: true,
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const status = async (contest) => {
    try {
        const { status, id } = contest;
        const c = await Contest.findByPk(id);
        if(c === null){
             throw new Error("Contest not found");
        }
        await Contest.update({ status }, {
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