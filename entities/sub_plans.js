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
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  plan name must be unique
            unique: true
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
            /*  in days */
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
        updatedAt: false
    });  
    return SubscriptionPlans;
};