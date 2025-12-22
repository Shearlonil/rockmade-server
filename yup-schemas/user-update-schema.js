const yup = require("yup");

const personal_info_schema = yup.object().shape({
    fname: yup.string().required("First Name is required"),
    lname: yup.string().required("Last Name is required"),
    dob: yup.date().required("date of birth is required"),
    gender: yup.string().max(1).required("Gender is required!"),
});

const pw_schema = yup.object().shape({
    old_pw: yup.string().min(6).required("Previous Password must be a min of 6 characters!"),
    pw: yup.string().min(6, "Password must be at least 6 characters!").required("New password is required"),
});

const otp_schema = yup.object().shape({
    otp: yup.string().required('otp is required for registration'),
});

const hcp_schema = yup.object().shape({
    hcp: yup.number().required('HCP is required'),
});

const hc_schema = yup.object().shape({
    hc_id: yup.number().required('Home Club is required'),
});

module.exports = {
    personal_info_schema,
    pw_schema,
    otp_schema,
    hcp_schema,
    hc_schema
};