module.exports = (sequelize, Sequelize) => {
  
    const Country = sequelize.define('Country', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment id automatically.
            autoIncrement:true,
            // id can not be null.
            allowNull:false,
            // For uniquely identifying user.
            primaryKey:true
        },
        nano_id:{
            type:Sequelize.STRING,
            // nano_id can not be null.
            allowNull:false,
            notEmpty:true,
            //  nano id must be unique
            // unique: 'nano_id'
        },
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  country name must be unique
            // unique: 'name'
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
        updatedAt: false,
        indexes: [{ unique: true, fields: ["name", 'nano_id'] }],
    });  
    return Country;
};