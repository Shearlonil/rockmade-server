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
        nano_id:{
            type:Sequelize.STRING,
            // nano_id can not be null.
            allowNull:false,
            notEmpty:true,
            //  course nano id must be unique
            // unique: 'nano_id'
        },
        name: {
            type: Sequelize.STRING,
            allowNull:false,
            notEmpty: true,
            //  course name must be unique
            // unique: 'name'
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
        updatedAt: false,
        indexes: [{ unique: true, fields: ["name", 'nano_id'] }],
    });  
    return Courses;
};