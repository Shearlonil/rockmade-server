module.exports = (sequelize, Sequelize) => {
  
    const CourseHoles = sequelize.define('CourseHoles', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment hole_id automatically.
            autoIncrement:true,
            // hold_id can not be null.
            allowNull:false,
            // For uniquely identifying hole.
            primaryKey:true
        },
        hole_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            notEmpty: true
        },
        course_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            notEmpty: true
        },
        hcp_idx: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        par: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
    }, {
        tableName: 'course_holes',
        timestamps: false,
        createdAt: false,
        updatedAt: false
    });  
    return CourseHoles;
};