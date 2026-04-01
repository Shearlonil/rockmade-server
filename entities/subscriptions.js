// Helper function
const uppercaseFirst = str => `${str[0].toUpperCase()}${str.substr(1)}`;

module.exports = (sequelize, Sequelize) => {
  
    const Subscriptions = sequelize.define('Subscriptions', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment id automatically.
            autoIncrement:true,
            // id can not be null.
            allowNull:false,
            // For uniquely identifying Subscriptions.
            primaryKey:true
        },
        plan_id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            allowNull:false,
            notEmpty: true,
        },
        // descriminator column for the plan linked up with this subscription: M => Membership, T => Training
        plan_type: {
            type: Sequelize.CHAR(1),
            allowNull:false,
            notEmpty: true,
        },
        paystack_transaction_ref: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  of course paystack transaction ref must be unique
            unique: 'paystack_transaction_ref'
        },
        amount: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        // field to determine where subscription period has been added to user's subscription.
        used: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull:false,
        },
    }, {
        tableName: 'subscriptions',
        timestamps: true,
        createdAt: true,
        updatedAt: false,
    });

    Subscriptions.getPlan = (options) => {
        if (!this.plan_type) return Promise.resolve(null);
        const mixinMethodName = `get${uppercaseFirst(this.plan_type)}`;
        return this[mixinMethodName](options);
    }
    return Subscriptions;
};