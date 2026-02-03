module.exports = (sequelize, Sequelize, game) => {
  
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
        game_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            references: {
                model: game, // database table name would also work
                key: 'id',
            }, 
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
        tableName: 'game_hole_rec',
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
                fields: ['hole_no', 'round_no', 'game_id'], // Combine foreign keys and your custom field
            },
        ],
    });  
    return GameHoleRecords;
};