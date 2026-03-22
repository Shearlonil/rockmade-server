module.exports = (sequelize, Sequelize) => {
  
    const Holes = sequelize.define('Holes', {
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
        hole_no: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'holes',
        timestamps: false,
        createdAt: false,
        updatedAt: false
    });  
    return Holes;
};