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
    const user = await User.findOne({
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
    // attach last user sub for use in jwt token
    const [lastSub, lastSubMetadata] = await db.sequelize.query(
        `select sub.plan_id, sub.createdAt, sp.name from subscriptions sub join sub_plans sp on sp.id = sub.plan_id where 
        sub.subscriber_id = :subscriber_id and sub.used = true ORDER BY sub.createdAt DESC limit 1`,
        {
            replacements: { subscriber_id: user.id },
        }
    );
    user.lastSub = lastSub[0];
    return user;
};

module.exports = {
    findStaffByEmail,
    findByEmail,
};