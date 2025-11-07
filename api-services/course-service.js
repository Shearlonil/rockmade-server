const db = require('../config/db-config');

const Course = db.courses;
const Staff = db.staff;
const Hole = db.holes;

const createGolfCourse = async (creator_id, course) => {
    try {
        const { name, no_of_holes, location, holes } = course;
        console.log('size of holes', holes.length);

        if(holes.length !== 9 || holes.length !== 18){
            throw new Error("Invalid number of holes specified");
        }

        const creator = await Staff.findByPk(creator_id);
        await db.sequelize.transaction( async (t) => {
            const c = await Course.create( { name, no_of_holes, location, creator_id: creator.id }, { transaction: t });
                
            for (const hole of holes) {
                const { hole_number, hcp, par } = hole;
                // const auth = await Hole.create({ hole_number, hcp, par, course_id: creator_id }, { transaction: t });
                await c.addHole(hole, { transaction: t });
            }
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

module.exports = {
    createGolfCourse,
};