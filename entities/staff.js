module.exports = (sequelize, Sequelize) => {
  
    const Staff = sequelize.define('Staff', {
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
        fname: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true
        },
        lname: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true
        },
        phone: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
        },
        pw: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true
        },
        email: {
            type: Sequelize.STRING,
            allowNull:false,
            isEmail: true,
            //  email must be unique
            unique: true
        },
        status: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull:false,
        },
        sex: {
            type: Sequelize.CHAR(1),
            allowNull:false,
            notEmpty: true
        },
        acc_creator: {
            type: Sequelize.BIGINT,
            allowNull:false,
        },
    }, {
        tableName: 'staff',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return Staff;
};