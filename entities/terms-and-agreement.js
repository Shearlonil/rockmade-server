module.exports = (sequelize, Sequelize) => {
  
    const TermsAndAgreement = sequelize.define('TermsAndAgreement', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment user_id automatically.
            autoIncrement:true,
            // user_id can not be null.
            allowNull:false,
            // For uniquely identifying staff.
            primaryKey:true
        },
        value: {
            type: Sequelize.JSON,
            allowNull:false,
            notEmpty: true,
        },
    }, {
        tableName: 'terms_and_agreement',
        timestamps: true,
    });  
    return TermsAndAgreement;
};