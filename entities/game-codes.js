module.exports = (sequelize, Sequelize) => {
  
    const GameCodes = sequelize.define('GameCodes', {
        /*  This class is responsible for holding view and join game codes for ongoing games and storing in db.
            When the game ends, the codes for the game will be deleted from the db.

            NOTE: code starting with 0 indicates join game, while code starting with 1 indicates view game.
            Both join_code and view_code are 10 characters long. The last 5 characters of both codes will be same while the first five will be different.
            Of the first five characters that will be different in both codes, the first character will indicate the type of code (join or view) as stated
            earlier in this paragraph.
        */
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment user_id automatically.
            autoIncrement:true,
            // user_id can not be null.
            allowNull:false,
            // For uniquely identifying user.
            primaryKey:true
        },
        join_code: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  game join code must be unique
            unique: true
        },
        view_code: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  game view code must be unique
            unique: true
        },
        /*  this holds the last five characters common to both join_code and view_code. Reason for this is for quick search. When the common code is
            generated, it can be searched if already existing to minimize chances of collision. Though, the four characters in the first half will alson
            be dynamically generated but it's safe to ensure if the last five characters don't match then there's uniqueness in the coees
        */
        common_code: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  game code must be unique
            unique: true
        },
    }, {
        tableName: 'game_codes',
        timestamps: false,
        createdAt: false,
        updatedAt: false
    });  
    return GameCodes;
};