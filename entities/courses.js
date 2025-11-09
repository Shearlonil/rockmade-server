module.exports = (sequelize, Sequelize) => {
  
    const Courses = sequelize.define('Courses', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
            allowNull:false,
            // For uniquely identifying courses.
            primaryKey:true
        },
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  course name must be unique
            unique: true
        },
        no_of_holes: {
            type: Sequelize.INTEGER,
            allowNull:false,
            notEmpty: true
        },
        location: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true
        },
        status: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull:false,
        },
    }, {
        tableName: 'courses',
        timestamps: true,
        createdAt: true,
        updatedAt: false
    });  
    return Courses;
};