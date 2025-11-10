module.exports = (sequelize, Sequelize) => {
  
    const ClientImgBlurhash = sequelize.define('ClientImgBlurhash', {
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
        blur_hash: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
        },
    }, {
        tableName: 'dp_blurhash',
        timestamps: false,
        createdAt: false,
        updatedAt: false
    });  
    return ClientImgBlurhash;
};