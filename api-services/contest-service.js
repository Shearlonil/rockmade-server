const db = require('../config/entities-config');
const { QueryTypes } = db.sequelize;

const Contest = db.contests;
const Hole = db.holes;

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

// for adding contests to holes (spicing up games)
const updateHoles = async (contests) => {
    try {
        await db.sequelize.transaction( async (t) => {
            for (const c of contests) {
                const contest = await Contest.findByPk(c.contest_id);
                if(contest){
                    for (const hole_id of c.holes) {
                        const h = await Hole.findByPk(hole_id);
                        await h.addContest(contest, { transaction: t });
                    }
                }else {
                    throw new Error("Invalid Contest specified");
                }
            }
        });
    } catch (error) {
         throw new Error(error.message); 
    }
}

const removeHole = async ({contest_id, hole_id}) => {
    try {
        await db.sequelize.query(
            'DELETE FROM jt_holes_contests WHERE contest_id = :contest_id and hole_id = :hole_id',
            {
                replacements: { contest_id, hole_id },
                type: QueryTypes.DELETE,
            }
        );
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

const findAllActive = async () => {
    return await Contest.findAll({ where: { status: true } });
}

module.exports = {
    create,
    update,
    updateHoles,
    removeHole,
    status,
    findAllActive,
};