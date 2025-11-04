/*  Model to represent Join table for applicants and posted Jobs.  */
module.exports = (sequelize, Sequelize, hole, contest) => {
  
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
        }
    }, {
        freezeTableName: true,
        tableName: 'jt_holes_contests',
        timestamps: false,
    });  
    return tblJoinHolesContests;
};