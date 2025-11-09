const db = require('../config/entities-config');

const Course = db.courses;
const Staff = db.staff;
const Hole = db.holes;
const Contest = db.contests;

const createGolfCourse = async (creator_id, course) => {
    try {
        const { name, hole_count, location, holes } = course;

        if(holes.length === 9 || holes.length === 18){
            const creator = await Staff.findByPk(creator_id);
            await db.sequelize.transaction( async (t) => {
                const c = await Course.create( { name, no_of_holes: hole_count, location, creator_id: creator.id }, { transaction: t });
                    
                for (const hole of holes) {
                    const { hole_no, hcp, par, contests = [] } = hole;
                    const h = await Hole.create({ hole_no, hcp_idx: hcp, par, course_id: c.id }, { transaction: t });
                    for (const id of contests) {
                        const contest = await Contest.findByPk(id);
                        if(contest == null){
                            throw new Error("Invalid Contest specified");
                        }
                        h.addContest(contest, { transaction: t });
                    }
                }
            });
        }else {
            throw new Error("Invalid number of holes specified");
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

module.exports = {
    createGolfCourse,
};