module.exports = (sequelize, Sequelize) => {
    /*  Table for holding emails to be changed
    */
    const EmailsToUpdate = sequelize.define('EmailsToUpdate', {
        nano_id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.STRING,
            // id can not be null.
            allowNull:false,
            notEmpty:true,
            // For uniquely identifying hole.
            primaryKey:true
        },
        current_email: {
            type: Sequelize.STRING,
            allowNull:false,
            isEmail: true,
            //  email must be unique
            unique: true
        },
        new_email: {
            type: Sequelize.STRING,
            allowNull:false,
            isEmail: true,
            //  email must be unique
            unique: true
        },
        user_type: {
            /*  Descriminator column for user => Staff (S) or Client/Customer (C)   */
            type: Sequelize.CHAR(1),
            defaultValue: 'C',
            allowNull:false,
            notEmpty: true,
        },
    }, {
        tableName: 'emails_to_update',
        timestamps: true,
        createdAt: false,
        updatedAt: true
    });  
    return EmailsToUpdate;
};