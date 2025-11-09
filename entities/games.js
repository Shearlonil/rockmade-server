module.exports = (sequelize, Sequelize) => {
  
    const Games = sequelize.define('Games', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
            allowNull:false,
            // For uniquely identifying games.
            primaryKey:true
        },
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  game name must be unique
            unique: true
        },
        date: {
            type: Sequelize.DATEONLY,
            allowNull:false,
            notEmpty: true
        },
        rounds: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        mode: {
            /*  1   => Tournament
                2   => Member Games
            */
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        hole_mode: {
            /*  1   => full 18
                2   => front 9
                3   => back 9
            */
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        status: {
            /*  1   => yet to start
                2   => in play
                3   => completed
            */
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'games',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return Games;
};