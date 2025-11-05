module.exports = (sequelize, Sequelize) => {
  
    const HoleScores = sequelize.define('HoleScores', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
            allowNull:false,
            // For uniquely identifying HoleScores.
            primaryKey:true
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
        tableName: 'hole_scores',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return HoleScores;
};