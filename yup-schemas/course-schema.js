const yup = require("yup");

let email_regx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const holeSchema = yup.object().shape({
    hole_number: yup.number().required("Hole Number is required"),
    hcp: yup.number().min(1, "Stroke Index must be at least 1").required("Stroke Index is required"),
    par: yup.number().positive("PAR must be positive").required("PAR is required"),
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