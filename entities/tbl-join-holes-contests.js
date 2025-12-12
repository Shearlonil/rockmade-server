/*  Model to represent Join table for holes and contests.  */
module.exports = (sequelize, Sequelize, hole, contest, courses) => {
  
    const tblJoinHolesContests = sequelize.define('tblJoinHolesContests', {
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
    });  
    return tblJoinHolesContests;
};