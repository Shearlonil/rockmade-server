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