const yup = require("yup");

const subPlans = yup.object().shape({
    id: yup.number().required("Subscription is required"),
    name: yup.string().required("Subscription name is required!"),
    amount: yup.number().min(1, "Amount must be at least 1").required('Amount is required'),
    duration_months: yup.number().min(1, "Duration must be at least 1 Month").required('Duration is required'),
    discount: yup.number().min(0, "Discount cannot be less 0").max(100, "Duration cannot exceed 100%").required('Discount is required'),
});

// for changing number of holes in a course. Either was 18 and now updating to 9 holes or was 9 and now updating to 18
const planBenefits = yup.object().shape({
    plan_id: yup.number().required('Subscription is required'),
    benefit_id: yup.number().required('Subscription benefit is required'),
    desc: yup.string().required("Subscription name is required!"),
});

module.exports = { subPlans, planBenefits };