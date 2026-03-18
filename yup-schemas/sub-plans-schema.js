const yup = require("yup");

const subPlanSchema = yup.object().shape({
    id: yup.number().required("Subscription is required"),
    name: yup.string().required("Subscription name is required!"),
    amount: yup.number().min(1, "Amount must be at least 1").required('Amount is required'),
    duration_months: yup.number().min(1, "Duration must be at least 1 Month").required('Duration is required'),
    discount: yup.number().min(0, "Discount cannot be less 0").max(100, "Duration cannot exceed 100%").required('Discount is required'),
});

const newBenefitSchema = yup.object().shape({
    plan_id: yup.number().required('Subscription benefit is required'),
    desc: yup.string().required("Subscription name is required!"),
});

const updateBenefitSchema = yup.object().shape({
    id: yup.number().required('Subscription benefit is required'),
    plan_id: yup.number().required('Subscription is required'),
    desc: yup.string().required("Subscription name is required!"),
});

module.exports = { subPlanSchema, newBenefitSchema, updateBenefitSchema };