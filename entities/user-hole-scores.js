module.exports = (sequelize, Sequelize) => {
    // holds users scores for a particular hole in a game
    const UserHoleScores = sequelize.define('UserHoleScores', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
            allowNull:false,
            // For uniquely identifying UserHoleScores.
            primaryKey:true
        },
        user_id: {
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
        tableName: 'user_hole_scores',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return UserHoleScores;
};