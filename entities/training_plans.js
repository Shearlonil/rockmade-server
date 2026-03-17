module.exports = (sequelize, Sequelize) => {
  
    const TrainingPlans = sequelize.define('TrainingPlans', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
            allowNull:false,
            // For uniquely identifying TrainingPlans.
            primaryKey:true
        },
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  trainingPlans name must be unique
            unique: true
        },
        desc: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
        },
        amount: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        duration_days: {
            /*  in days */
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        status: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'training_plans',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return TrainingPlans;
};