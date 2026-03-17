// Helper function
const uppercaseFirst = str => `${str[0].toUpperCase()}${str.substr(1)}`;

module.exports = (sequelize, Sequelize) => {
  
    const Subscriptions = sequelize.define('Subscriptions', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
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
        // descriminator column for the plan linked up with this subscription
        plan_type: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
        },
        paystack_transaction_ref: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  of course paystack transaction ref must be unique
            unique: true
        },
        amount: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'subscriptions',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });

    Subscriptions.getPlan = (options) => {
        if (!this.plan_type) return Promise.resolve(null);
        const mixinMethodName = `get${uppercaseFirst(this.plan_type)}`;
        return this[mixinMethodName](options);
    }
    return Subscriptions;
};