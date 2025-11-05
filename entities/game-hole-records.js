module.exports = (sequelize, Sequelize) => {
  
    const GameHoleRecords = sequelize.define('GameHoleRecords', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
            allowNull:false,
            // For uniquely identifying GameHoleRecords.
            primaryKey:true
        },
        hole_no: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        round_no: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'game_hold_rec',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return GameHoleRecords;
};