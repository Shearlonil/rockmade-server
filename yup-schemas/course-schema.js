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
        .min(3, "Location must be a min of 3 characters!")
        .required("Location is required!"),
    holes: yup.array().of(holeSchema).min(9, "At least 9 holes are required").required("Holes are required"),
});

const courseUpdate = yup.object().shape({
    id: yup.number().required("Course is required"),
    name: yup.string().required("Course name is required!"),
    location: yup
        .string()
        .min(3, "Location must be a min of 3 characters!")
        .required("Location is required!"),
});

// for changing number of holes in a course. Either was 18 and now updating to 9 holes or was 9 and now updating to 18
const courseHoleCountUpdateSchema = yup.object().shape({
    course_id: yup.number().required('Golf Course is required'),
    holes: yup.array().of(holeSchema).min(9, "At least 9 holes are required").required("Holes are required"),
});

// for updating values (par and hcp) of a hole in a course
const courseHoleUpdateSchema = yup.object().shape({
    course_id: yup.number().required('Golf Course is required'),
    hole_id: yup.number().required('Hole is required'),
    hcp: yup.number().min(1, "Stroke Index must be at least 1").max(18, "Stroke Index cannot exceed 18").required("Stroke Index is required"),
    par: yup.number().min(3, "PAR cannot be less than 3").max(5, "PAR cannot exceed 5").required("PAR is required"),
});

module.exports = { schema, courseUpdate, courseHoleCountUpdateSchema, courseHoleUpdateSchema };