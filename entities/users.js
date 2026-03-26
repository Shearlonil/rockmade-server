module.exports = (sequelize, Sequelize) => {
  
    const Users = sequelize.define('Users', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment user_id automatically.
            autoIncrement:true,
            // user_id can not be null.
            allowNull:false,
            // For uniquely identifying user.
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
        dob: {
            type: Sequelize.DATEONLY,
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
            // unique: 'email'
        },
        status: {
            /*  1   => Active
                2   => Suspended
                3   => NonActive
            */
            type: Sequelize.CHAR(1),
            allowNull:false,
            notEmpty: true
        },
        gender: {
            type: Sequelize.CHAR(1),
            allowNull:false,
            notEmpty: true
        },
        sub_expiration: {
            type: Sequelize.DATEONLY,
            allowNull:false,
            notEmpty: true,
        },
        hcp: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true,
            defaultValue: 0.0,
        },
    }, {
        tableName: 'users',
        timestamps: true,
        createdAt: true,
        updatedAt: false,
        indexes: [{ unique: true, fields: ["email", 'nano_id'] }],
    });  
    return Users;
};