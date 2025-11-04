module.exports = (sequelize, Sequelize) => {
  
    const Notification = sequelize.define('Notification', {
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
        title: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true
        },
        msg: {
            type: Sequelize.JSON,
            allowNull:false,
            notEmpty: true
        },
        audience: {
            // G for General notification, S for Seeker notification and E for Emploher notification
            type: Sequelize.CHAR(1),
            allowNull:false,
            notEmpty: true
        },
        creator: {
            type: Sequelize.BIGINT,
            allowNull:false,
        }
    }, {
        tableName: 'notifications',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return Notification;
};