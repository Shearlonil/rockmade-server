const yup = require("yup");

const schema = yup.object().shape({
    name: yup.string().required("Name is required!"),
    rounds: yup
        .number().integer().min(1, "Rounds must be at least 1")
        .required("Rounds is required!"),
    mode: yup
        .number().integer().min(1, "Invalid game mode specified")
        .required("Game mode is required!"),
    hole_mode: yup.number().integer().min(1, "Invalid hole mode specified").max(3, "Invalid hole mode specified").required("Location is required"),
});

module.exports = schema;