const yup = require("yup");

let email_regx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const routeNumberMiscParamSchema = yup.number().required("number is required");

// https://stackoverflow.com/questions/64440963/positive-numbers-only-formik-yup-schema
const routePositiveNumberMiscParamSchema = yup.number().required("Number is required").test('Is positive?', 'ERROR: The number must be greater than 0!', 
    (value) => value > 0
);
const routeZeroOrGtParamSchema = yup.number().required("Number is required").test('Is positive?', 'ERROR: The number must be greater than or equal to 0!', 
    (value) => value >= 0
);

const routeEmailParamSchema = yup.string().matches(email_regx, 'A valid email format example@mail.com is required');

const routePasswordParamSchema = yup.string().min(6, 'Password must be a minimum of 6 characters').required("Password must be a min of 6 characters!");

const routeStringMiscParamSchema = yup.string().max(255, "Maximum of 255 characters").required("String Required");

const routeBooleanParamSchema = yup.bool().required("Boolean Required");

module.exports = { 
    routeNumberMiscParamSchema,
    routeEmailParamSchema,
    routePasswordParamSchema,
    routeStringMiscParamSchema,
    routePositiveNumberMiscParamSchema,
    routeBooleanParamSchema,
    routeZeroOrGtParamSchema
};