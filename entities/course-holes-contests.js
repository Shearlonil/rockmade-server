/*  Model to represent Join table for holes and contests.  */
module.exports = (sequelize, Sequelize, hole, contest, courses) => {
  
    const CourseHolesContests = sequelize.define('CourseHolesContests', {
        id:{
            // Sequelize module has INTEGER Data_Type.
            type:Sequelize.BIGINT,
            // To increment course_id automatically.
            autoIncrement:true,
            // course_id can not be null.
            allowNull:false,
            // For uniquely identifying UserGameGroup.
            primaryKey:true
        },
        hole_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            references: {
                model: hole, // database table name would also work
                key: 'id',
            }, 
        },
        contest_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            references: {
                model: contest, // database table name would also work
                key: 'id',
            },
        },
        course_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            references: {
                model: courses, // database table name would also work
                key: 'id',
            },
        },
    }, {
        freezeTableName: true,
        tableName: 'jt_holes_contests',
        timestamps: false,
        indexes: [
            {
                unique: true,
                /*  Sequelize's belongsToMany association automatically creates a unique key on the foreign keys within 
                    the through model (junction table) by default. This composite unique key combines the foreign keys 
                    of the source and target models, ensuring that each pair of associated records in the through table 
                    is unique.

                    ref: Gemini.
                    when searching "sequelize belongsToMany creating unique key for sourceKey and targetKey"
                */
                fields: ['hole_id', 'contest_id', 'course_id'], // Combine foreign keys and your custom field
            },
        ],
    });  
    return CourseHolesContests;
};