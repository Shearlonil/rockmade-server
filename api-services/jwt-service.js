const db = require('../config/entities-config');

const Staff = db.staff;
const Authority = db.staffAuths;
const User = db.users;
const Course = db.courses;
const ImgKeyHash = db.imgKeyHash;

/*  This service exists solely to be used in jwt.js to search for staff and user by email. Reason for creating
    this file and not using staff-service and client-service is to avoid cyclic-dependency.
    staff-service -> jwt (createRefreshToken). Same with client-service.
    if findEmail in staff and client services are both used, then:
    jwt -> staff-service. This will create a cyclic dependency
*/

const findStaffByEmail = async email => {
    return await Staff.findOne({ 
        where: { email },
        include: {
            model: Authority,
        }
    });
};

const findByEmail = async email => {
    return await User.findOne({
        where: { email },
        include: [
            {
                model: Course,
            },
            {
                model: ImgKeyHash,
            }
        ]
    });
};

module.exports = {
    findStaffByEmail,
    findByEmail,
};