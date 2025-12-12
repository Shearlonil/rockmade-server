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
});

const updateSchema = yup.object().shape({
    game_id: yup
        .number().integer().min(1, "Invalid Golf Course specified")
        .required("Golf Course is required!"),
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

const contestsUpdateSchema = yup.object().shape({
    game_id: yup
        .number().integer().min(1, "Invalid Golf Course specified")
        .required("Golf Course is required!"),
    course_id: yup
        .number().integer().min(1, "Invalid Golf Course specified")
        .required("Golf Course is required!"),
    contests: yup.array().of(contestSchema),
});

module.exports = {schema, updateSchema, contestsUpdateSchema};