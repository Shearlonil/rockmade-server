const db = require('../config/entities-config');
const { Op } = require('sequelize');
const { QueryTypes } = db.sequelize;
const { format } = require('date-fns');

const Course = db.courses;
const Game = db.games;
const Hole = db.holes;
const Contest = db.contests;
const GameHoleContest = db.gameHoleContests;
const UserGameGroup = db.userGameGroup;

const findOngoingRoundById = async id => {
    const game = await Game.findByPk(id, {
        include: [
            {
                model: GameHoleContest,
            },
        ]
    });
    const course = await Course.findByPk(game.course_id,
        { 
            include: [
                {
                    model: Hole,
                    as: 'holes',
                    include: [
                        { 
                            model: Contest,
                            as: 'contests',
                            through: {
                                where: {
                                    course_id: game.course_id,
                                }
                            },
                        }
                    ],
                },
            ]
        }
    );
    return {game, course};
};

const rawFindOngoingRoundById = async id => {
    // Ongoing Games/Rounds
    const [ongoingRoundsResult, ongoingRoundsMetadata] = await db.sequelize.query(
        `select games.id, games.name, games.date, games.rounds, games.mode, games.hole_mode, games.status, courses.name as course_name, 
        courses.id as course_id, games.createdAt from games join courses on games.course_id = courses.id where games.id = :id and games.status < 3`,
        {
            replacements: { id },
        }
    );
    return ongoingRoundsResult[0];
};

const createGame = async (creator_id, game) => {
    try {
        const { name, course_id, hole_mode, startDate, mode, contests = [] } = game;
        const course = await Course.findOne({
            where: { 
                status: true,
                id: course_id,
            },
            include: [
                {
                    model: Hole,
                    as: 'holes',
                    include: [
                        { 
                            model: Contest,
                            as: 'contests'
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
                        const hole = course.holes.find(h => h.hole_no === hole_no);
                        const contest = hole.contests.find(hc => hc.id === dbContest.id);
                        await GameHoleContest.create(
                            {hole_id: hole.dataValues.id, contest_id: contest.id, game_id: game.id},
                            { transaction: t }
                        );
                    }
                }
                await UserGameGroup.create({
                    name: "1",
                    round_no: 1,
                    start_time: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
                    user_id: creator_id,
                    game_id: game.id
                }, 
                { transaction: t })
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

const updateGame = async (creator_id, game) => {
    /*  NOTE: Changing Hole mode (either from 18 to front 9 or back 9, or front 9 to back 9 or which every way, deletes all previously attached contests to the 
        game   */
    try {
        const { game_id, name, course_id, hole_mode, startDate } = game;
        // new course
        const course = await Course.findOne({
            where: { 
                status: true,
                id: course_id,
            },
            include: [
                {
                    model: Hole,
                    as: 'holes',
                    include: [
                        { 
                            model: Contest,
                            as: 'contests',
                            through: {
                                where: {
                                    course_id,
                                }
                            },
                        }
                    ],
                },
            ]
        });
        if(course){
            await db.sequelize.transaction( async (t) => {
                const game = await Game.findOne({
                    where: { 
                        id: game_id,
                        creator_id,
                        status: {
                            [Op.between] : [1, 2]
                        }
                    },
                    include: [
                        {
                            model: GameHoleContest,
                        },
                    ]
                });
                if(game){
                    // if same hole mode
                    if(game.hole_mode == hole_mode){
                        // if not same course, migrate contests in previous course to new course of same hole (if supported by hole. If not, then delete contest)
                        if(game.course_id != course_id){
                            for (const element of game.GameHoleContests) {
                                const hole = course.holes.find(h => h.dataValues.id === element.dataValues.hole_id);
                                if(hole){
                                    // check if hole supports contest
                                    const contest = hole.contests.find(c => c.id === element.dataValues.contest_id);
                                    if (!contest) {
                                        // delete contest for new hole
                                        await db.sequelize.query(
                                            'DELETE ghc FROM game_hole_contests as ghc WHERE ghc.game_id = :game_id and ghc.contest_id = :contest_id and ghc.hole_id = :hole_id',
                                            {
                                                replacements: { 
                                                    game_id, 
                                                    contest_id: element.dataValues.contest_id,
                                                    hole_id: hole.id
                                                },
                                                type: QueryTypes.DELETE,
                                                transaction: t,
                                            }
                                        );
                                    }
                                }
                            }
                        }
                    }else {
                        // delete all attached contests regardless of course (new course or update - retaining old course)
                        await db.sequelize.query(
                            'DELETE ghc FROM game_hole_contests as ghc WHERE ghc.game_id = :game_id',
                            {
                                replacements: { game_id, },
                                type: QueryTypes.DELETE,
                                transaction: t,
                            }
                        );
                    }
                    const date = format(startDate, "yyyy-MM-dd");
                    game.name = name;
                    game.course_id = course_id;
                    game.hole_mode = hole_mode;
                    game.date = date;
                    await game.save({ transaction: t });
                }else {
                    throw new Error('Invalid Game specified');
                }
            });
            // due to changes may have been made to game model, refetch
            const g = await Game.findOne({
                where: { 
                    id: game_id,
                    creator_id,
                    status: {
                        [Op.between] : [1, 2]
                    }
                },
                include: [
                    {
                        model: GameHoleContest,
                    },
                ]
            });
            return { g, course };
        }else {
            throw new Error("Invalid Golf Course specified");
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const updateGameContests = async (creator_id, game) => {
    try {
        const { course_id, game_id, contests = [] } = game;
        const course = await Course.findOne({
            where: { 
                status: true,
                id: course_id,
            },
            include: [
                {
                    model: Hole,
                    as: 'holes',
                    include: [
                        { 
                            model: Contest,
                            as: 'contests',
                            through: {
                                where: {
                                    course_id,
                                }
                            },
                        }
                    ],
                },
            ]
        });
        return await db.sequelize.transaction( async (t) => {
            const game = await Game.findOne({
                where: { creator_id, course_id, id: game_id },
            });
            if(game){
                // FIRST: delete all contests associated with previous holes for this course
                await db.sequelize.query(
                    'DELETE ghc FROM game_hole_contests as ghc WHERE ghc.game_id = :game_id',
                    {
                        replacements: { game_id },
                        type: QueryTypes.DELETE,
                        transaction: t,
                    }
                );
                for (const c of contests) {
                    const dbContest = await Contest.findByPk(c.id);
                    for(const hole_no of c.holes){
                        const hole = course.holes.find(h => h.hole_no === hole_no);
                        const contest = hole.contests.find(hc => hc.id === dbContest.id);
                        await GameHoleContest.create(
                            {hole_id: hole.dataValues.id, contest_id: contest.id, game_id: game.id},
                            { transaction: t }
                        );
                    }
                }
            }else {
                throw new Error('Invalid Game specified');
            }
            return game;
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

module.exports = {
    findOngoingRoundById,
    rawFindOngoingRoundById,
    createGame,
    updateGame,
    updateGameContests,
};