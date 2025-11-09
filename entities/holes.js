module.exports = (sequelize, Sequelize) => {
  
    const Holes = sequelize.define('Holes', {
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
        hole_no: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        hcp_idx: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        par: {
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