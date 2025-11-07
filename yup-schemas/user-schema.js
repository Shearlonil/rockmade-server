const yup = require("yup");

let email_regx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const schema = yup.object().shape({
    fname: yup.string().required("First Name is required!"),
    lname: yup.string().required("Last Name is required!"),
    email: yup
        .string()
        .email()
        .matches(email_regx, 'A valid personal email format email@mail.com is required').required("Email is required"),
    phone: yup.string().test('len', 'Phone number must be 11 characters', val => val.length === 11).required("Phone number is required"),
    gender: yup
        .string()
        .max(1)
        .required("Gender is required!"),
    pw: yup
        .string()
        .min(6)
        .required("Password must be a min of 6 characters!"),
    hcp: yup.number().required('HCP is required'),
    hc_id: yup.number().required('Home Club is required'),
    // otp sent to mail for registration
    otp: yup.string().required('otp is required for registration'),
});

module.exports = schema;