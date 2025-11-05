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
        user_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            notEmpty: true
        },
        game_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'user_game_group',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return UserGameGroup;
};