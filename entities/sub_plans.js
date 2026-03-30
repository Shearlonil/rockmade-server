module.exports = (sequelize, Sequelize, DataTypes) => {
  
    const SubscriptionPlans = sequelize.define('SubscriptionPlans', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment id automatically.
            autoIncrement:true,
            // id can not be null.
            allowNull:false,
            // For uniquely identifying SubscriptionPlans.
            primaryKey:true
        },
        nano_id:{
            type:Sequelize.STRING,
            // nano_id can not be null.
            allowNull:false,
            notEmpty:true,
            //  nano id must be unique
            // unique: 'nano_id'
        },
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  plan name must be unique
            // unique: 'name'
        },
        desc: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
        },
        amount: {
            type: DataTypes.DECIMAL(19,2),
            defaultValue: 0,
            allowNull:false,
            notEmpty: true
        },
        discount: {
            type: DataTypes.DECIMAL(19,2),
            defaultValue: 0,
            allowNull:false,
            notEmpty: true
        },
        duration_months: {
            /*  in months */
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        popular: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'sub_plans',
        timestamps: true,
        createdAt: true,
        updatedAt: false,
        indexes: [{ unique: true, fields: ["name", 'nano_id'] }],
    });  
    return SubscriptionPlans;
};