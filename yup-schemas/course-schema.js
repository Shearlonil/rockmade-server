const yup = require("yup");

const holeSchema = yup.object().shape({
    hole_no: yup.number().required("Hole Number is required"),
    hcp: yup.number().min(1, "Stroke Index must be at least 1").max(18, "Stroke Index cannot exceed 18").required("Stroke Index is required"),
    par: yup.number().min(3, "PAR cannot be less than 3").max(5, "PAR cannot exceed 5").required("PAR is required"),
    contests: yup.array().of(yup.number()),
});

const schema = yup.object().shape({
    name: yup.string().required("Course name is required!"),
    hole_count: yup.number().min(9, "Number of holes must be at least 9").required('Number of Holes is required'),
    location: yup
        .string()
        .required("Location must be a min of 6 characters!"),
    holes: yup.array().of(holeSchema).min(9, "At least 9 holes are required").required("Holes are required"),
});

module.exports = schema;