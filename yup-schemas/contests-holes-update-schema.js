const yup = require("yup");

const holeSchema = yup.object().shape({
    contest_id: yup.number().required("Contest is required"),
    holes: yup.array().of(yup.number().min(1, "Add at least one hole to contest")),
});

const schema = yup.object().shape({
    course_id: yup.number().required("Course is required"),
    contests: yup.array().of(holeSchema).min(1, "Update at least 1 contest").required("Contests to update are required"),
});

module.exports = schema;