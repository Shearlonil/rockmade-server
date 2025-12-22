const yup = require("yup");

let email_regx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const schema = yup.object().shape({
    fname: yup.string().required("First Name is required!"),
    lname: yup.string().required("Last Name is required!"),
    email: yup
        .string()
        .email()
        .matches(email_regx, 'A valid personal email format email@mail.com is required').required("Email is required"),
    dob: yup.date().required("Date of Birth is required"),
    gender: yup
        .string()
        .max(1)
        .required("Gender is required!"),
    pw: yup
        .string()
        .min(6, "Password must be a min of 6 characters!")
        .required("Password is required"),
    country_id: yup.number().required("Country is required!"),
    hcp: yup.number().required('HCP is required'),
    hc_id: yup.number().required('Home Club is required'),
    // otp sent to mail for registration
    otp: yup.string().required('otp is required for registration'),
});

module.exports = schema;