/*  Model to represent Join table for Staff and Auths.  */
module.exports = (sequelize, Sequelize, staff, authority) => {
  
    const JoinTblStaffAuths = sequelize.define('JoinTblStaffAuths', {
        staff_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            references: {
                model: staff, // database table name would also work
                key: 'id'
            }
        },
        auth_id: {
            type: Sequelize.BIGINT,
            allowNull:false,
            references: {
                model: authority, // database table name would also work
                key: 'id',
            },
        }
    }, {
        freezeTableName: true,
        tableName: 'jt_staff_auths',
        timestamps: false,
    });  
    return JoinTblStaffAuths;
};