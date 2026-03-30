const db = require('../config/entities-config');
const axios = require('axios');
const crypto = require('crypto');
const numeral = require('numeral');
const { subDays, addDays, format } = require('date-fns');

const SubscriptionPlans = db.subscriptionPlans;
const TrainingPlans = db.trainingPlans;
const User = db.users;
const Subscriptions = db.subscriptions;

const initializeMembershipTransaction = async (user_id, plan_nano_id) => {
    const plan = await SubscriptionPlans.findOne({
        where: { nano_id: plan_nano_id },
        attributes: ['id', 'amount', 'discount', 'duration_months', 'name', 'desc'],
    });
    return await finishPaymentInitialization(user_id, plan, 'Membership');
};

const initializeTrainingTransaction = async (user_id, plan_nano_id) => {
    const plan = await TrainingPlans.findOne({
        where: { nano_id: plan_nano_id },
        attributes: ['id', 'amount', 'discount', 'duration_days', 'name', 'desc'],
    });
    return await finishPaymentInitialization(user_id, plan, 'Training');
};

const verifySubTransaction = async (user_id, reqQuery) => {
    try {
        const response = await axios.get(`${process.env.PAYSTACK_TRANSACTION_VERIFICATION_URL}${reqQuery}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            },
        );
        if(response.data.data.status === 'success'){
            const client = await User.findByPk(id);
            // find product in db 
            const planType = response.data.data.metadata.custom_fields.find(cf => cf.variable_name === 'plan_type');
            if(planType.value.toUpperCase() === 'MEMBERSHIP'){
                const sub = await SubscriptionPlans.findByPk(response.data.data.metadata.product_id);
                // check current user sub expiration: if expired, calculate next expiraton date from today, else add new sub duration to sub expiration
                const yesterday = subDays(new Date(), 1); // Subtracts 1 day from today to use as sub_expiration
                const birthDay = format(yesterday, "yyyy-MM-dd");
            }

        }
        return response.data;
    } catch (error) {
        throw new Error(error.message);
    }
};

const webhook = async (paystackData, paystack_signature) => {
    try {
        //  validate event
        const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(paystackData)).digest('hex');
        if (hash && paystack_signature && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(paystack_signature))) {
            // Do something with event
            switch (paystackData.event) {
                case 'charge.success':
                    const planType = paystackData.data.metadata.custom_fields.find(cf => cf.variable_name === 'plan_type');
                    await Subscriptions.create({
                        plan_id: paystackData.data.metadata.product_id,
                        plan_type: planType.value.toUpperCase() === 'MEMBERSHIP' ? 'M' : 'T',
                        paystack_transaction_ref: paystackData.data.reference,
                        amount: paystackData.data.amount,
                    });
            }
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

const finishPaymentInitialization = async (user_id, plan, sub_type) => {
    const client = await User.findByPk(user_id, {
        where: { status: true },
    });

    const metadata = {
        product_id: plan.id,
        custom_fields: [
            {
                display_name: 'Discount',
                variable_name: 'discount',
                value: plan.discount,
            },
            {
                display_name: 'Payment Mode',
                variable_name: 'plan_type',
                value: sub_type,
            },
        ]
    };
    const data = {
        email: client.email,
        amount: plan.amount * 100,  //  multiply by 100 to convert to subunit of Naira (N1 => 100K),
        currency: "NGN",
        metadata,
    };

    const payload = JSON.stringify(data);

    try {
        const response = await axios.post(process.env.PAYSTACK_TRANSACTION_INI_URL, payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            },
        );

      return response.data;
    } catch (error) {
        throw new Error(error.message   );
    }
}

module.exports = {
    initializeMembershipTransaction,
    initializeTrainingTransaction,
    verifySubTransaction,
    webhook,
};