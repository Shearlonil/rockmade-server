const db = require('../config/entities-config');
const { format } = require('date-fns');
const { QueryTypes } = db.sequelize;

const Course = db.courses;
const Game = db.games;
const Hole = db.holes;
const Contest = db.contests;
const GameHoleContest = db.gameHoleContests;

const createGame = async (creator_id, game) => {
    try {
        const { name, course_id, hole_mode, startDate, mode, contests = [] } = game;
        const course = await Course.findByPk(course_id, {
            where: { status: true },
            include: [
                {
                    model: Hole,
                    include: [
                        { 
                            model: Contest,
                            as: 'contest'
                        }
                    ],
                },
            ]
        });
        if(course){
            const date = format(startDate, "yyyy-MM-dd");
            return await db.sequelize.transaction( async (t) => {
                const game = await Game.create( 
                    { name, date, rounds: 1, creator_id, mode, hole_mode, status: 1, course_id }, 
                    { transaction: t }
                );
                for (const c of contests) {
                    const dbContest = await Contest.findByPk(c.id);
                    for(const hole_no of c.holes){
                        const hole = course.Holes.find(h => h.hole_no === hole_no);
                        const contest = hole.contest.find(hc => hc.id === dbContest.id);
                        await GameHoleContest.create(
                            {hole_id: hole.dataValues.id, contest_id: contest.id, game_id: game.id},
                            { transaction: t }
                        );
                    }
                }
                return game;
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