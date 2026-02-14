module.exports = (sequelize, Sequelize) => {
  
    const UserGameGroup = sequelize.define('UserGameGroup', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
            allowNull:false,
            // For uniquely identifying UserGameGroup.
            primaryKey:true
        },
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true
        },
        round_no: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        start_time: {
            type: Sequelize.DATE,
            allowNull:false,
            notEmpty: true
        },
        status: {
            /*  status of player in the group, true for active, false for removed from game/group
                if game status is 1 (yet to play), then when delete is initiated from the front-end, player is
                completely removed from the game.
                if game status is 2 (in play) & delete is initiated from the front-end, status (in this entity)
                is set to false.... this is the sole purpose of this field
            */
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'user_game_group',
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
            fields: ['user_id', 'game_id', 'name', 'round_no'], // Combine foreign keys and your custom field
        },
      ],
    });  
    return UserGameGroup;
};