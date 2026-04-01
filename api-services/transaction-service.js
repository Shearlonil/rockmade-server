const db = require('../config/entities-config');
const axios = require('axios');
const crypto = require('crypto');
const numeral = require('numeral');
const { compareAsc, add, format } = require('date-fns');

const SubscriptionPlans = db.subscriptionPlans;
const TrainingPlans = db.trainingPlans;
const User = db.users;
const Course = db.courses;
const ImgKeyHash = db.imgKeyHash;
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

const verifySubTransaction = async (user_id, paystackRef) => {
    try {
        const response = await axios.get(`${process.env.PAYSTACK_TRANSACTION_VERIFICATION_URL}${paystackRef}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            },
        );
        if(response.data.data.status === 'success'){
            const client = await User.findByPk(user_id, {
                where: {status: true},
                attributes: ['id', 'nano_id', 'fname', 'lname', 'sub_expiration', 'email', 'gender', 'dob', 'status', 'hcp', ],
                include: [
                    {
                        model: Course,
                    },
                    {
                        model: ImgKeyHash,
                    },
                ]
            });
            const user_sub = await Subscriptions.findOne({
                where: {
                    paystack_transaction_ref: paystackRef,
                    used: false,
                    subscriber_id: user_id,
                }
            });
            if(!user_sub){
                throw new Error("Invalid Transaction Reference");
            }
            // find product in db 
            const planType = response.data.data.metadata.custom_fields.find(cf => cf.variable_name === 'plan_type');
            if(planType.value.toUpperCase() === 'MEMBERSHIP'){
                const sub = await SubscriptionPlans.findByPk(response.data.data.metadata.product_id);
                // check current user sub expiration: if expired, calculate next expiraton date from today, else add new sub duration to sub expiration
                if(compareAsc(new Date(), new Date(client.sub_expiration)) >= 0){
                    // current date (date method is called, which coult be today) is greater/equal to user's sub expiration date
                    const result = add(new Date(), { months: sub.duration_months });
                    client.sub_expiration = format(result, "yyyy-MM-dd");
                }else {
                    // user's expiration date is in the future.
                    const result = add(new Date(client.sub_expiration), { months: sub.duration_months });
                    client.sub_expiration = format(result, "yyyy-MM-dd");
                }
            }
            // update used field for this subsciption
            user_sub.used = true;
            await db.sequelize.transaction( async (t) => {
                await client.save({ transaction: t });
                await user_sub.save({ transaction: t });
            });
            // find subscribed plan to use in jwt
            const plan = await SubscriptionPlans.findOne({
                where: { 
                    id: user_sub.plan_id 
                },
                attributes: ['name'],
            });
            const lastSub = { name: plan.name, createdAt: user_sub.createdAt };
            client.lastSub = lastSub;
            return client;
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
                    const user = await User.findOne({ where: { email: paystackData.data.customer.email } });
                    const planType = paystackData.data.metadata.custom_fields.find(cf => cf.variable_name === 'plan_type');
                    await Subscriptions.create({
                        plan_id: paystackData.data.metadata.product_id,
                        plan_type: planType.value.toUpperCase() === 'MEMBERSHIP' ? 'M' : 'T',
                        paystack_transaction_ref: paystackData.data.reference,
                        amount: numeral(paystackData.data.amount).divide(100).value(),
                        subscriber_id: user.id,
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