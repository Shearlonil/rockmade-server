module.exports = (sequelize, Sequelize) => {
    /*  ref: https://www.youtube.com/watch?v=oKDxIqYfjYY&t=472s
        Possibility of user signing in from different devices. Hence, relationship mimicks ONeToMany 
    */
    const RefreshTokens = sequelize.define('RefreshTokens', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment id automatically.
            autoIncrement:true,
            // id can not be null.
            allowNull:false,
            // For uniquely identifying hole.
            primaryKey:true
        },
        user_id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // user_id can not be null.
            allowNull:false,
            notEmpty:true
        },
        token: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  token must be unique
            unique: true
        },
        user_type: {
            /*  Descriminator column for user => Staff (S) or Client/Customer (C)   */
            type: Sequelize.CHAR(1),
            defaultValue: 'C',
            allowNull:false,
            notEmpty: true,
        },
    }, {
        tableName: 'refresh_tokens',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return RefreshTokens;
};