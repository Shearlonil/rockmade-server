module.exports = (sequelize, Sequelize) => {
  
    const Contests = sequelize.define('Contests', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment hole_id automatically.
            autoIncrement:true,
            // hold_id can not be null.
            allowNull:false,
            // For uniquely identifying hole.
            primaryKey:true
        },
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  contest name must be unique
            unique: true
        },
        status: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull:false,
        },
    }, {
        tableName: 'contests',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return Contests;
};