module.exports = (sequelize, Sequelize) => {
  
    const MailOTP = sequelize.define('MailOTP', {
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
        email: {
            type: Sequelize.STRING,
            allowNull:false,
            isEmail: true,
            //  email must be unique
            unique: true
        },
        otp: {
            // refresh token for this user
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
        },
    }, {
        tableName: 'email_otp',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return MailOTP;
};