module.exports = (sequelize, Sequelize) => {
  
    const SubPlanBenefits = sequelize.define('SubPlanBenefits', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment id automatically.
            autoIncrement:true,
            // id can not be null.
            allowNull:false,
            // For uniquely identifying SubPlanBenefits.
            primaryKey:true
        },
        desc: {
            type: Sequelize.STRING(50),
            allowNull:false,
            notEmpty: true,
        },
    }, {
        tableName: 'sub_plans_benefits',
        timestamps: true,
        createdAt: false,
        updatedAt: true
    });  
    return SubPlanBenefits;
};