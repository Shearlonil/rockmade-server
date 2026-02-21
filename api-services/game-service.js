const db = require('../config/entities-config');
// const { Op } = require('sequelize');
const Op = db.Op;
const sql = db.sql;
const { QueryTypes } = db.sequelize;
const { format } = require('date-fns');
const { gameCodeGenerator, generateOTP } = require('../utils/otp-generator');

const Course = db.courses;
const Game = db.games;
const GameCodes = db.gameCodes;
const Hole = db.holes;
const Contest = db.contests;
const GameHoleContest = db.gameHoleContests;
const GameHoleRecords = db.gameHoleRecords;
const HoleScores = db.holeScores;
const HoleContestScores = db.userHoleContestScores;
const UserGameGroup = db.userGameGroup;
const User = db.users;
const ImgKeyHash = db.imgKeyHash;

const findOngoingRoundById = async id => {
    const game = await Game.findOne({
        where: { 
            id,
            status: {
                [Op.between] : [1, 2]
            }
        },
        include: [
            {
                model: GameHoleContest,
            },
            {
                model: GameHoleRecords,
                include: [
                    { model: HoleScores, },
                    { model: HoleContestScores, },
                ]
            },
            {
                model: GameCodes,
                attributes: ['join_code', 'view_code'],
            },
            {
                model: User,
                attributes: ['id', 'fname', 'lname', 'hcp'],
                as: 'users',
                include: {
                    model: ImgKeyHash,
                }
            },
        ]
    });
    if(game){
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
    }else {
        throw new Error("Game not found");
    }
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
        const { name, course_id, hole_mode, startDate, mode, contests = [], rounds } = game;
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
            const g =  await db.sequelize.transaction( async (t) => {
                const game = await Game.create( 
                    { name, date, rounds, creator_id, mode, hole_mode, status: 1, course_id, group_size: 4, current_round: 1 }, 
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
                    start_time: format(startDate, "yyyy-MM-dd HH:mm:ss"),
                    user_id: creator_id,
                    game_id: game.id
                }, { transaction: t });
                // generate game codes
                const code = await generateGameCode();
                const join_code = '0' + generateOTP(4) + code;
                const view_code = '1' + generateOTP(4) + code;
                await GameCodes.create({ game_id: game.id, common_code: code, join_code, view_code }, { transaction: t })
                return game;
            });
            return await Game.findByPk(g.id, {
                include: [
                    {
                        model: GameHoleContest,
                    },
                    {
                        model: GameCodes,
                        attributes: ['join_code', 'view_code'],
                    },
                    {
                        model: User,
                        attributes: ['id', 'fname', 'lname', 'hcp'],
                        as: 'users',
                        include: {
                            model: ImgKeyHash,
                        }
                    },
                ]
            });
        }else {
            throw new Error("Invalid Golf Course specified");
        }
    } catch (error) {
        if(error.name === 'SequelizeUniqueConstraintError'){
            throw new Error(error.errors[0].value + " not available. Please use a different value");
        }
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
                                        // TODO: test
                                        /*  delete previously saved scores for players regarding this unsupported contest for hole in new course. To do this, remember user_hole_contest_scores
                                            is assocatied to only game_hole_record via field game_hole_rec_id. This means we need to get the game_hole_record first to get it's id to use
                                            in the delete query. The game_hole_record can be fetched using the game id and hole_no */
                                        await db.sequelize.query(
                                            'DELETE uhcs FROM user_hole_contest_scores as uhcs WHERE uhcs.game_hole_rec_id = (select id from game_hole_rec ghc where ghc.game_id = :game_id and ghc.hole_no = :hole_no)',
                                            {
                                                replacements: { 
                                                    game_id, 
                                                    hole_no: hole.hole_no
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
                        // TODO: test
                        // delete all saved contest scores regardless of course (new course or update - retaining old course)
                        await db.sequelize.query(
                            `DELETE uhcs FROM user_hole_contest_scores as uhcs WHERE uhcs.game_hole_rec_id IN (SELECT id FROM game_hole_rec ghc where ghc.game_id = :game_id)`,
                            {
                                replacements: { game_id, },
                                type: QueryTypes.DELETE,
                                transaction: t,
                            }
                        );
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
                    throw new Error('Cannot update game. Invalid Operation!.');
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

const updateGroupScores = async (game_id, data) => {
    try {
        const { hole_no, scores } = data;
        const game = await Game.findOne({
            where: { 
                id: game_id,
                status: {
                    [Op.between] : [1, 2]
                }
            },
            include: [
                {
                    model: User,
                    attributes: ['id'],
                    as: 'users',
                },
            ]
        });
        if(game){
            await db.sequelize.transaction( async (t) => {
                const [ghc, created] = await GameHoleRecords.upsert({ game_id, hole_no, round_no: game.current_round }, { returning: true, transaction: t, });
                let game_hole_rec_id;
                if(created && ghc.id){
                    game_hole_rec_id = ghc.id;
                }else {
                    const ghc = await GameHoleRecords.findOne({ where: { game_id, hole_no, round_no: game.current_round } });
                    game_hole_rec_id = ghc.id;
                }
                for(const score of scores){
                    if(score.score > 0){
                        // ensure user is part of the game, may have been deleted and sender didn't refresh
                        const found = game.users.find(user => user.dataValues.id === score.player);
                        if(found){
                            await HoleScores.upsert({ user_id: score.player, score: score.score, game_hole_rec_id }, { transaction: t, });
                        }else {
                            throw new Error("Player not found. Possible delete operation performed on player. Consider refreshing your page");
                        }
                    }else {
                        await db.sequelize.query(
                            `DELETE uhs FROM user_hole_scores as uhs WHERE uhs.user_id = :user_id and uhs.game_hole_rec_id = :game_hole_rec_id`,
                            {
                                replacements: { user_id: score.player, game_hole_rec_id },
                                type: QueryTypes.DELETE,
                                transaction: t,
                            }
                        );
                    }
                }
                // change game status to 'in play'
                game.status = 2;
                await game.save({transaction: t});
                return ghc;
            });
        }else {
            throw new Error('Invalid Operation!.');
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
};

const updateGroupContestScores = async (game_id, data) => {
    try {
        const { hole_no, scores, contest_id } = data;
        const game = await Game.findOne({
            where: { 
                id: game_id,
                status: {
                    [Op.between] : [1, 2]
                }
            },
            include: [
                {
                    model: User,
                    attributes: ['id'],
                    as: 'users',
                },
            ]
        });
        if(game){
            await db.sequelize.transaction( async (t) => {
                const [ghc, created] = await GameHoleRecords.upsert({ game_id, hole_no, round_no: game.current_round }, { returning: true, transaction: t, });
                let game_hole_rec_id;
                if(created && ghc.id){
                    game_hole_rec_id = ghc.id;
                }else {
                    const ghc = await GameHoleRecords.findOne({ where: { game_id, hole_no, round_no: game.current_round } });
                    game_hole_rec_id = ghc.id;
                }
                for(const score of scores){
                    if(score.score > 0){
                        // ensure user is part of the game, may have been deleted and sender didn't refresh
                        const found = game.users.find(user => user.dataValues.id === score.player);
                        if(found){
                            await HoleContestScores.upsert({ user_id: score.player, score: score.score, game_hole_rec_id, contest_id }, { transaction: t, });
                        }else {
                            throw new Error(`Player not found. Possible delete operation performed on player. Consider refreshing your page`);
                        }
                    }else {
                        await db.sequelize.query(
                            `DELETE uhcs FROM user_hole_contest_scores as uhcs WHERE uhcs.user_id = :user_id and uhcs.game_hole_rec_id = :game_hole_rec_id and uhcs.contest_id = :contest_id`,
                            {
                                replacements: { user_id: score.player, game_hole_rec_id, contest_id },
                                type: QueryTypes.DELETE,
                                transaction: t,
                            }
                        );
                    }
                }
                // change game status to 'in play'
                game.status = 2;
                await game.save({transaction: t});
                return ghc;
            });
        }else {
            throw new Error('Invalid Operation!.');
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
};

const updateGroupSize = async ({ game_id, group_size}) => {
    try {
        const game = await Game.findOne({
            where: { 
                id: game_id,
                status: 1
            },
        });
        if(game){
            await db.sequelize.transaction( async (t) => {
            
                const [results, metadata] = await db.sequelize.query(
                    `SELECT COUNT(name) as group_size, name, round_no, game_id FROM user_game_group where round_no = :round_no and game_id = :game_id 
                    GROUP BY name, game_id`, {
                        replacements: { 
                            round_no: game.current_round, game_id
                        },
                    }
                );
                const filtered = results.filter(result => result.group_size > group_size);
                for (const element of filtered) {
                    const diff = element.group_size - group_size;
                    console.log(element, 'difference', diff);
                }
            });
        }else {
            throw new Error('Invalid Operation!.');
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
};

const delOngoingRound = async (creator_id, game_id) => {
    try {
        const game = await Game.findOne({
            where: { 
                id: game_id,
                creator_id,
                status: {
                    [Op.between] : [1, 2]
                }
            },
        });
        if(game){
            await db.sequelize.transaction( async (t) => {
                // delete all attached contests to game
                await db.sequelize.query(
                    'DELETE ghc FROM game_hole_contests as ghc WHERE ghc.game_id = :game_id',
                    {
                        replacements: { game_id, },
                        type: QueryTypes.DELETE,
                        transaction: t,
                    }
                );
                // delete all associated groups
                await db.sequelize.query(
                    'DELETE ugg FROM user_game_group as ugg WHERE ugg.game_id = :game_id',
                    {
                        replacements: { game_id, },
                        type: QueryTypes.DELETE,
                        transaction: t,
                    }
                );
                // delete associated codes
                await db.sequelize.query(
                    'DELETE gc FROM game_codes as gc WHERE gc.game_id = :game_id',
                    {
                        replacements: { game_id, },
                        type: QueryTypes.DELETE,
                        transaction: t,
                    }
                );
                await Game.destroy( {
                    where: {  id: game_id },
                    force: true,
                    transaction: t,
                } );
            });
        }else {
            throw new Error('Invalid Operation!.');
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

const addPlayers = async (creator_id, prop) => {
    const { game_id, currentGroupSize, players, groupProp } = prop;
    try {
        if(currentGroupSize < 2 || currentGroupSize > 5){
            throw new Error("Invalid group size specifiec");
        }
        const game = await Game.findOne({
            where: { 
                id: game_id,
                // creator_id,
                status: {
                    [Op.between] : [1, 2]
                }
            },
        });
        if(game){
            // First count number of existing members in the group
            const count = await UserGameGroup.count({
                where: {
                    name: groupProp.group_name,
                    game_id: game.id,
                    round_no: groupProp.round_no,
                }
            });
            // be sure size of new players + count (existing player) isn't more than currentGroupSize
            if ((players.length + count) > currentGroupSize) {
                throw new Error("Players exceed group size");
            }
            await db.sequelize.transaction( async (t) => {
                for (const player of players) {
                    await UserGameGroup.create({
                        name: groupProp.group_name,
                        round_no: groupProp.round_no,
                        start_time: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
                        user_id: player,
                        game_id: game.id
                    },
                    { transaction: t })
                }
                game.group_size = currentGroupSize;
                await game.save({ transaction: t });
            });
        }else {
            throw new Error('Invalid Operation!.');
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

const updatePlayerGroup = async (creator_id, prop) => {
    const { player_id, game_id, currentGroupSize, groupProp } = prop;
    try {
        if(currentGroupSize < 2 || currentGroupSize > 5){
            throw new Error("Invalid group size specified");
        }
        const game = await Game.findOne({
            where: { 
                id: game_id,
                creator_id,
                status: 1   //  can only change player group if game isn't started yet
            },
        });
        if(game){
            const count = await UserGameGroup.count({
                where: {
                    name: groupProp.group_name,
                    game_id: game.id,
                    round_no: groupProp.round_no,
                }
            });
            // be sure incoming user (1) + count (existing players in group) isn't more than currentGroupSize
            if ((1 + count) > currentGroupSize) {
                throw new Error("Players exceed group size");
            }
            await db.sequelize.transaction( async (t) => {
                await  db.sequelize.query(
                    `UPDATE user_game_group SET name = :group_name WHERE game_id = :game_id and user_id = :player_id and round_no = :round`,
                    {
                        replacements: { player_id, round: game.current_round, group_name: groupProp.group_name, game_id },
                        type: QueryTypes.UPDATE, // Specify the query type
                        transaction: t,
                    }
                );
                game.group_size = currentGroupSize;
                await game.save({ transaction: t });
            });
        }else {
            throw new Error('Invalid Operation!.');
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

const removePlayer = async (creator_id, { player_id, game_id }) => {
    // NOTE: only game creator can delete a player
    try {
        const game = await Game.findOne({
            where: { 
                id: game_id,
                creator_id,
                status: {
                    [Op.between] : [1, 2]
                }
            },
        });
        if(game){
            await db.sequelize.transaction( async (t) => {
                // Remove user from group
                await db.sequelize.query(
                    'DELETE ugg FROM user_game_group as ugg WHERE ugg.game_id = :game_id and ugg.user_id = :player_id',
                    {
                        replacements: { game_id, player_id },
                        type: QueryTypes.DELETE,
                        transaction: t,
                    }
                );
                // delete all recorded contests scores for this user (if any)
                await db.sequelize.query(
                    'DELETE uhcs FROM user_hole_contest_scores as uhcs WHERE uhcs.user_id = :player_id and uhcs.game_hole_rec_id IN (select id from game_hole_rec ghc where ghc.game_id = :game_id)',
                    {
                        replacements: { 
                            game_id, 
                            player_id
                        },
                        type: QueryTypes.DELETE,
                        transaction: t,
                    }
                );
                // delete all recorded hole scores for this user (if any)
                await db.sequelize.query(
                    'DELETE uhs FROM user_hole_scores as uhs WHERE uhs.user_id = :player_id and uhs.game_hole_rec_id IN (select id from game_hole_rec ghc where ghc.game_id = :game_id)',
                    {
                        replacements: { 
                            game_id, 
                            player_id
                        },
                        type: QueryTypes.DELETE,
                        transaction: t,
                    }
                );
            });
        }else {
            throw new Error('Invalid Operation!.');
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

const updateGameSpices = async (creator_id, game) => {
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
                include: [
                    {
                        model: GameHoleContest,
                    },
                ]
            });
            if(game){
                // variable to hold newly added game hole contests to be sent to front-end for ui update
                const ghcArr = [];
                /*  Because of the possibility of contests changed from one hole to the other, or contests removed from holes, create 2 maps to hold
                    new contests for holes supplied from front-end and previous contests saved in db.
                */
                const prevContestMap = new Map();
                const newContestMap = new Map();
                game.GameHoleContests.forEach(ghc => prevContestMap.set(ghc.dataValues.hole_id, ghc.dataValues));
                // delete all contests associated with previous holes for this course
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
                        // const ghc = {hole_id: hole.dataValues.id, contest_id: contest.id, game_id: game.id};
                        const ghc = await GameHoleContest.create( {hole_id: hole.dataValues.id, contest_id: contest.id, game_id: game.id}, { transaction: t } );
                        ghcArr.push(ghc);
                        newContestMap.set(hole.dataValues.id, {hole_id: hole.dataValues.id, contest_id: contest.id, game_id: game.id})
                    }
                }
                // find keys in prevContestMap not in newContestMap depicting/indicating removed contests for certain holes
                const keysInPrevContestMap = [...prevContestMap.keys()].filter(key => !newContestMap.has(key));
                // find keys with different values depicting/indicating replaced/swapped contests in holes
                const keysWithDiffVal = [...prevContestMap.keys()].filter(key => newContestMap.has(key) && newContestMap.get(key).contest_id !== prevContestMap.get(key).contest_id);
                // for removed contests, delete saved scores for all users in db
                if(keysInPrevContestMap.length > 0){
                    // delete all saved contest scores regardless of course (new course or update - retaining old course)
                    const holeNoArr = keysInPrevContestMap.map(key => course.holes.find(h => h.id === key).dataValues.hole_no);
                    await db.sequelize.query(
                        `DELETE uhcs FROM user_hole_contest_scores as uhcs WHERE uhcs.game_hole_rec_id IN (SELECT id FROM game_hole_rec ghc where ghc.game_id = :game_id and ghc.hole_no IN (:hole_no))`,
                        {
                            replacements: { 
                                game_id,
                                hole_no: holeNoArr,
                            },
                            type: QueryTypes.DELETE,
                            transaction: t,
                        }
                    );
                }
                // for replaced/swapped contests, simple update the contest id(s) in user_hole_contest_scores for the particular holes
                if(keysWithDiffVal.length > 0){
                    for (const key of keysWithDiffVal) {
                        // for a hole id, find the hole number, get the old/previous contest id, get the new/updated contest id
                        const hole_no = course.holes.find(h => h.id === key).dataValues.hole_no;
                        const prev_contest_id = prevContestMap.get(key).contest_id;
                        const new_contest_id = newContestMap.get(key).contest_id;
                        await  db.sequelize.query(
                            `UPDATE user_hole_contest_scores SET contest_id = :new_contest_id WHERE contest_id = :prev_contest_id and game_hole_rec_id = (
                            SELECT id from game_hole_rec ghc where ghc.game_id = :game_id and ghc.hole_no = :hole_no)`,
                            {
                                replacements: { new_contest_id, prev_contest_id, hole_no, game_id },
                                type: QueryTypes.UPDATE, // Specify the query type
                                transaction: t,
                            }
                        );
                    }
                }
                return ghcArr;
            }else {
                throw new Error('Invalid Operation. Please contact game creator');
            }
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const generateGameCode = async () => {
    let code;
    let inExitence;
    do {
        code = gameCodeGenerator();
        inExitence = await GameCodes.findOne({
            where: { 
                common_code: code,
            }
        });
    } while (inExitence);
    return code;
};

module.exports = {
    findOngoingRoundById,
    rawFindOngoingRoundById,
    createGame,
    updateGame,
    updateGroupScores,
    updateGroupContestScores,
    updateGroupSize,
    delOngoingRound,
    addPlayers,
    updatePlayerGroup,
    removePlayer,
    updateGameSpices,
};