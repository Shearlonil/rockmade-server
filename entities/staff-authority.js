module.exports = (sequelize, Sequelize) => {
  
    const Authority = sequelize.define('Authority', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment user_id automatically.
            autoIncrement:true,
            // user_id can not be null.
            allowNull:false,
            // For uniquely identifying staff.
            primaryKey:true
        },
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true
        },
        code: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        desc: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'authorities',
        timestamps: false,
    });  
    return Authority;
};