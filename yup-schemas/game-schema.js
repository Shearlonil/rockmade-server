const yup = require("yup");

const contestSchema = yup.object().shape({
    id: yup.number().required("Hole is required"),
    name: yup.string().required("Hole is required"),
    holes: yup.array().of(yup.number()),
});

const schema = yup.object().shape({
    name: yup.string().required("Name is required!"),
    course_id: yup
        .number().integer().min(1, "Invalid Golf Course specified")
        .required("Golf Course is required!"),
    contests: yup.array().of(contestSchema),
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
    players: yup.array().of(yup.number()).min(1, "At least 1 player is required").required("Players are required"),
    groupProp: yup.object().shape({
        round_no: yup.number().required("Group is required"),
        group_name: yup.number().required("Group name is required"),
        isNew: yup.boolean().required("Group status not indicated"),
    })
});

module.exports = {schema, updateSchema, spicesUpdateSchema, addPlayerSchema};