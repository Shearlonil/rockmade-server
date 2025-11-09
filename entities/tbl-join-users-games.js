/*  Model to represent Join table for users and games.  */
module.exports = (sequelize, Sequelize, hole, contest) => {
  
    const tblJoinUsersGames = sequelize.define('tblJoinUsersGames', {
        user_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            references: {
                model: user, // database table name would also work
                key: 'id',
            }, 
        },
        game_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            references: {
                model: game, // database table name would also work
                key: 'id',
            },
        }
    }, {
        freezeTableName: true,
        tableName: 'jt_users_games',
        timestamps: false,
    });  
    return tblJoinUsersGames;
};