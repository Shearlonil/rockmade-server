const yup = require("yup");

let email_regx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const personal_info_schema = yup.object().shape({
    fname: yup.string().required("First Name is required"),
    lname: yup.string().required("Last Name is required"),
    dob: yup.date().required("date of birth is required"),
    gender: yup.string().max(1).required("Gender is required!"),
});

const pw_schema = yup.object().shape({
    current_pw: yup.string().min(6, "Current Password must be a min of 6 characters!").required("Current Password is required"),
    pw: yup.string().min(6, "Password must be at least 6 characters!").required("New password is required"),
});

const otp_schema = yup.object().shape({
    otp: yup.string().required('otp is required for registration'),
});

const hcp_schema = yup.object().shape({
    hcp: yup.number().min(0, "HCP cannot be less than 0").required('HCP is required'),
});

const hc_schema = yup.object().shape({
    hc_id: yup.number().min(1, "Valid Home Club is required").required('Home Club is required'),
});

const email_schema = yup.object().shape({
    otp: yup.string().required('otp is required for registration'),
    email: yup
            .string()
            .email()
            .matches(email_regx, 'A valid personal email format email@mail.com is required').required("Email is required"),
});

module.exports = {
    personal_info_schema,
    pw_schema,
    otp_schema,
    hcp_schema,
    hc_schema,
    email_schema,
};