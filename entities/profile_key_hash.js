module.exports = (sequelize, Sequelize) => {
  
    const ProfileImgKeyhash = sequelize.define('ProfileImgKeyhash', {
        /*  This class is responsible for hashing the image filename and storing in db.
            This key is used in ImageComponent for reloading the image whenever the profile image is changed
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
        key_hash: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
        },
    }, {
        tableName: 'dp_keyhash',
        timestamps: false,
        createdAt: false,
        updatedAt: false
    });  
    return ProfileImgKeyhash;
};