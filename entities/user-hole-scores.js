module.exports = (sequelize, Sequelize, gameHoleRecords, users) => {
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
        game_hole_rec_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            references: {
                model: gameHoleRecords, // database table name would also work
                key: 'id',
            }, 
        },
        user_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            notEmpty: true,
            references: {
                model: users, // database table name would also work
                key: 'id',
            }, 
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
        updatedAt: false,
        indexes: [
            {
                unique: true,
                /*  Sequelize's belongsToMany association automatically creates a unique key on the foreign keys within 
                    the through model (junction table) by default. This composite unique key combines the foreign keys 
                    of the source and target models, ensuring that each pair of associated records in the through table 
                    is unique.

                    ref: Gemini.
                    when searching "sequelize belongsToMany creating unique key for sourceKey and targetKey"
                */
                fields: ['game_hole_rec_id', 'user_id'], // Combine foreign keys and your custom field
            },
        ],
    });  
    return UserHoleScores;
};