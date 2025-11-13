module.exports = (sequelize, Sequelize) => {
  
    const Country = sequelize.define('Country', {
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
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  country name must be unique
            unique: true
        },
        status: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull:false,
        },
    }, {
        tableName: 'countries',
        timestamps: false,
        createdAt: false,
        updatedAt: false
    });  
    return Country;
};