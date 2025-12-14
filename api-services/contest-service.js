const db = require('../config/entities-config');
const { QueryTypes } = db.sequelize;

const Contest = db.contests;
const Hole = db.holes;
const HoleContest = db.holesContests;

const findById = async (id) => {
    return await Contest.findByPk(id);
}

const create = async (creator_id, name) => {
    try {
        return await Contest.create({ name, creator_id }, { returning: true, });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const paginateFetch = async (prop) => {
    // page: Current page number (e.g., 1-indexed), pageSize: Number of items per page
    const {page, pageSize, status} = prop; 

    let size = pageSize * 1;    // convert to number
    const offset = (page - 1) * size;
    const s = JSON.parse(status)

    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.status, c.createdAt, s.fname, s.lname, s.sex, s.email, s.phone FROM contests c inner join staff s on 
        c.creator_id = s.id WHERE c.status = :s LIMIT :size OFFSET :offset`, {
            replacements: { 
                size, s, offset
            },
        }
    );
    const count = await Contest.count({where: {status: s}});
    return {count, results};
}

const search = async (prop) => {
    const { str, status } = prop;
    const s = JSON.parse(status)
    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.status, c.createdAt, s.fname, s.lname, s.sex, s.email, s.phone FROM contests c inner join staff s on 
        c.creator_id = s.id WHERE c.name LIKE :searchPattern and c.status = :s`, {
            replacements: { 
                searchPattern: `%${str}%`,
                s,
            },
        }
    );
    return results;
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
const updateHoles = async ({contests, course_id}) => {
    try {
        await db.sequelize.transaction( async (t) => {
            for (const c of contests) {
                const contest = await Contest.findByPk(c.contest_id);
                if(contest){
                    for (const hole_id of c.holes) {
                        const h = await Hole.findByPk(hole_id);
                        await HoleContest.create({hole_id: h.id, contest_id: contest.id, course_id}, { transaction: t });
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

const removeHole = async ({contest_id, hole_id, course_id}) => {
    try {
        await db.sequelize.query(
            'DELETE FROM jt_holes_contests WHERE contest_id = :contest_id and hole_id = :hole_id and course_id = :course_id',
            {
                replacements: { contest_id, hole_id, course_id },
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

/*  method to initialize Contests page with 100 active contests to use as defaultOptions for AsyncSelect
    and also count total active contests for pagination component */
const activeContestsPageInit = async (pageSize) => {
    let size = pageSize * 1;    // convert to number
    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.status, c.createdAt, s.fname, s.lname, s.sex, s.email, s.phone FROM contests c inner join staff s on 
        c.creator_id = s.id WHERE c.status = ${'true'} LIMIT :size`, {
            replacements: { 
                size
            },
        }
    );
    const count = await Contest.count({where: {status: true}});
    return {count, results};
}

module.exports = {
    findById,
    paginateFetch,
    search,
    create,
    update,
    updateHoles,
    removeHole,
    status,
    findAllActive,
    activeContestsPageInit,
};