const yup = require("yup");

const contestSchema = yup.object().shape({
    id: yup.number().required("Contest is required"),
    name: yup.string().required("Contest is required"),
    holes: yup.array().of(yup.number()).typeError("Collection of holes required"),
});

const scoreSchema = yup.object().shape({
    player: yup.number().required("Player is required"),
    score: yup.number().min(0, "Invalid player score specified").required("Score is required"),
});

const schema = yup.object().shape({
    name: yup.string().required("Name is required!"),
    course_id: yup
        .number().integer().min(1, "Invalid Golf Course specified")
        .required("Golf Course is required!"),
    contests: yup.array().of(contestSchema).typeError("Collection of contests required"),
    startDate: yup.date().required("Game Date is required"),
    /*  1   => full 18
        2   => front 9
        3   => back 9
    */
    hole_mode: yup.number().integer().min(1, "Invalid hole mode specified").max(3, "Invalid hole mode specified").required("No of holes is required"),
    /*  1   => Tournament
        2   => Member Games
    */
    mode: yup.number().integer().min(1, "Invalid game mode specified").max(3, "Invalid game mode specified").required("Game mode is required"),
    rounds: yup
        .number().integer().min(1, "Minimum round required is 1")
        .required("Round is required!"),
});

const updateSchema = yup.object().shape({
    game_id: yup
        .number().integer().min(1, "Invalid Game specified")
        .required("Game is required!"),
    name: yup.string().required("Name is required!"),
    course_id: yup
        .number().integer().min(1, "Invalid Golf Course specified")
        .required("Golf Course is required!"),
    startDate: yup.date().required("Game Date is required"),
    /*  1   => full 18
        2   => front 9
        3   => back 9
    */
    hole_mode: yup.number().integer().min(1, "Invalid hole mode specified").max(3, "Invalid hole mode specified").required("No of holes is required"),
});

const spicesUpdateSchema = yup.object().shape({
    game_id: yup
        .number().integer().min(1, "Invalid Game specified")
        .required("Game is required!"),
    course_id: yup
        .number().integer().min(1, "Invalid Golf Course specified")
        .required("Golf Course is required!"),
    contests: yup.array().of(contestSchema),
    rounds: yup
        .number().integer().min(1, "Minimum round required is 1")
        .required("Round is required!"),
});

const addPlayerSchema = yup.object().shape({
    game_id: yup
        .number().integer().min(1, "Invalid Game specified")
        .required("Game is required!"),
    currentGroupSize: yup
        .number().integer().min(2, "Invalid group size specified").max(5, "Invalid group size specified")
        .required("Group size is required!"),
    players: yup.array().of(yup.number()).typeError("Collection of players required").min(1, "At least 1 player is required").required("Players are required"),
    groupProp: yup.object().shape({
        round_no: yup.number().required("Round is required"),
        group_name: yup.number().min(1, "Invalid Group specified").required("Group name is required"),
    })
});

const playerScoresSchema = yup.object().shape({
    hole_no: yup.number().min(1, "Invalid hole number specified").required("Hole number is required"),
    scores: yup.array().of(scoreSchema).typeError("Collection of scores required").min(1, "At least a player is required").required("Player scores are required"),
});

const playerContestScoresSchema = yup.object().shape({
    hole_no: yup.number().min(1, "Invalid hole number specified").required("Hole number is required"),
    contest_id: yup.number().min(1, "Invalid contest specified").required("Contest is required"),
    scores: yup.array().of(scoreSchema).typeError("Collection of scores required").min(1, "At least a player is required").required("Player scores are required"),
});

const playerRemovalSchema = yup.object().shape({
    game_id: yup
        .number().integer().min(1, "Invalid Game specified")
        .required("Game is required!"),
    player_id: yup
        .number().integer().min(1, "Invalid Player specified")
        .required("Player is required!"),
});

const playerGroupChangeSchema = yup.object().shape({
    game_id: yup
        .number().integer().min(1, "Invalid Game specified")
        .required("Game is required!"),
    player_id: yup
        .number().integer().min(1, "Invalid Player specified")
        .required("Player is required!"),
    currentGroupSize: yup
        .number().integer().min(2, "Invalid group size specified").max(5, "Invalid group size specified")
        .required("Group size is required!"),
    groupProp: yup.object().shape({
        round_no: yup.number().required("Round is required"),
        group_name: yup.number().min(1, "Invalid Group specified").required("Group name is required"),
    }),
});

const playersGroupSwapSchema = yup.object().shape({
    game_id: yup
        .number().integer().min(1, "Invalid Game specified")
        .required("Game is required!"),
    playerOne: yup.object().shape({
        id: yup.number().integer().min(1, "Invalid Source Player specified").required("Source Player is required"),
        group_name: yup
            .number().integer().min(1, "Invalid Group specified")
            .required("Group name is required"),
    }),
    playerTwo: yup.object().shape({
        id: yup.number().integer().min(1, "Invalid Destination Player specified").required("Destination Player is required"),
        group_name: yup
            .number().integer().min(1, "Invalid Group specified")
            .required("Group name is required"),
    }),
});

module.exports = {
    schema, 
    updateSchema, 
    spicesUpdateSchema, 
    addPlayerSchema, 
    playerScoresSchema, 
    playerContestScoresSchema,
    playerRemovalSchema,
    playerGroupChangeSchema,
    playersGroupSwapSchema,
};