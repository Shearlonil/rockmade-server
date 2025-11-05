module.exports = (sequelize, Sequelize) => {
  
    const HoleContests = sequelize.define('HoleContests', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
            allowNull:false,
            // For uniquely identifying HoleContests.
            primaryKey:true
        },
        contest_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            notEmpty: true
        },
        user_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            notEmpty: true
        },
        game_hole_rec_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            notEmpty: true
        },
        score: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'hole_contests',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return HoleContests;
};