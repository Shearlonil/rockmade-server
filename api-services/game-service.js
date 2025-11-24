const db = require('../config/entities-config');
const { format } = require('date-fns');

const Course = db.courses;
const Game = db.games;
const Hole = db.holes;
const Contest = db.contests;

const createGame = async (creator_id, game) => {
    try {
        const { name, course_id, hole_mode, startDate, mode, contests } = game;
        const course = await Course.findByPk(course_id, {
            where: { status: true },
        });
        if(course){
            const date = format(startDate, "yyyy-MM-dd");
            await db.sequelize.transaction( async (t) => {
                const g = await Game.create( { name, date, rounds: 1, creator_id, mode, hole_mode, status: 1 }, { transaction: t });
                    
                for (const c of contests) {
                    const contest = await Contest.findByPk(c.id);
                    if(contest){
                        await h.addContest(contest, { transaction: t });
                    }else {
                        throw new Error("Invalid Contest specified ");
                    }
                }
            });
        }else {
            throw new Error("Invalid Golf Course specified");
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

module.exports = {
    createGame,
};