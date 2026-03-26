module.exports = (sequelize, Sequelize) => {
  
    const Contests = sequelize.define('Contests', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment id automatically.
            autoIncrement:true,
            // id can not be null.
            allowNull:false,
            // For uniquely identifying hole.
            primaryKey:true
        },
        nano_id:{
            type:Sequelize.STRING,
            // nano_id can not be null.
            allowNull:false,
            notEmpty:true,
        },
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
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
        updatedAt: false,
        indexes: [{ unique: true, fields: ["name", 'nano_id'] }],
    });  
    return Contests;
};