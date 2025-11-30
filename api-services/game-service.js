const db = require('../config/entities-config');
const { format } = require('date-fns');
const { QueryTypes } = db.sequelize;

const Course = db.courses;
const Game = db.games;
const Hole = db.holes;
const Contest = db.contests;

const createGame = async (creator_id, game) => {
    try {
        const { name, course_id, hole_mode, startDate, mode, contests } = game;
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
                const holeArr = [];
                const constArr = [];
                for (const c of contests) {
                    const dbContest = await Contest.findByPk(c.id);
                    // console.log(c.holes[0]);
                    for(const hole_no of c.holes){
                        const hole = course.Holes.find(h => h.hole_no === hole_no);
                        // console.log(hole);
                        const contest = hole.contest.find(hc => hc.id === dbContest.id);
                        const [results, metadata] = await db.sequelize.query(
                            'INSERT INTO jt_holes_contests (hole_id, contest_id) VALUES (:val1, :val2)',
                            {
                                replacements: { val1: hole.dataValues.id, val2: contest.id },
                                type: QueryTypes.INSERT,
                                transaction: t, // Pass the transaction object
                            }
                        );
                        // holeArr.push(hole);
                        // constArr.push(contest)
                        // await hole.addContest(contest, {transaction: t});
                    }
                }
                // console.log(holeArr.length, constArr.length);
                return await Game.create( 
                    { name, date, rounds: 1, creator_id, mode, hole_mode, status: 1, course_id }, 
                    { transaction: t }
                );
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