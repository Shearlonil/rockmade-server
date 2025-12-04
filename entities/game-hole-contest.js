module.exports = (sequelize, Sequelize) => {
    /*  Stores contest associated to hole for a particular game   */
    const GameHoleContests = sequelize.define('GameHoleContests', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
            allowNull:false,
            // For uniquely identifying GameHoleContests.
            primaryKey:true
        },
        hole_id: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        contest_id: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'game_hole_contests',
        timestamps: false,
        createdAt: false,
        updatedAt: false
    });  
    return GameHoleContests;
};