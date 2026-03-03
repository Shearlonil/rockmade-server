const db = require('../config/entities-config');
const { QueryTypes } = db.sequelize;
const bcrypt = require('bcryptjs');
const { format } = require('date-fns');

const otpMailService = require('./mail-otp-service');
const { generateOTP } = require('../utils/otp-generator');
const { decrypt } = require('../utils/crypto-helper');

const Staff = db.staff;
const Authority = db.staffAuths;
const MailOTP = db.mailOTP;

const findById = async id => {
    return await Staff.findByPk(id, {
        attributes: ['id', 'fname', 'lname', 'phone', 'email', 'sex', 'acc_creator', 'status', 'createdAt'],
    });
};

const findByIdWithAuths = async id => {
    const staff = await Staff.findByPk(id, {
        attributes: ['id', 'fname', 'lname', 'phone', 'email', 'sex', 'acc_creator', 'status', 'createdAt'],
        include: {
            model: Authority,
        }
    });
    const creator = await Staff.findByPk(staff.acc_creator, {
        attributes: ['fname', 'lname']
    });
    // attach creator to dataValues. Only place to attach extra data, else it won't be received on the frontend
    staff.dataValues.creator = creator;
    const all_auths = await getAuthorities();
    return { staff, all_auths };
};

const findByEmail = async email => {
    return await Staff.findOne({ 
        where: { email },
        include: {
            model: Authority,
        }
    });
};

const dashboardInfo = async () => {
    const currentDate = format(new Date(), "yyyy-MM-dd");
    // total users
    const [totalUsersResult, totalUsersMetadata] = await db.sequelize.query(`select count(users.id) as total_users from users`);
    // total subscribed users
    const [subscribedUsersResult, subscribedUsersMetadata] = await db.sequelize.query(
        `select count(users.id) as sub_users from users where sub_expiration >= :currentDate`,
        {
            replacements: { currentDate },
        }
    );
    // total active golf courses
    const [activeCoursesResult, activeCoursesMetadata] = await db.sequelize.query(`select count(courses.id) as total_courses from courses where courses.status = true`);
    // top 5 most played courses
    const [topPlayedCoursesResult, topPlayedCoursesMetadata] = await db.sequelize.query(
        `select count(games.course_id) as occurence, courses.name from courses join games on games.course_id = courses.id group by games.course_id 
        order by occurence desc limit 5`);
    // total contests
    const [results, metadata] = await db.sequelize.query(`select count(contests.id) as total_contests from contests`);
    results[0].total_users = totalUsersResult[0];
    results[0].sub_users = subscribedUsersResult[0];
    results[0].active_courses = activeCoursesResult[0];
    results[0].top_courses = topPlayedCoursesResult;
    return results[0];
}

const updatePersonalInfo = async (id, profile) => {
    const { fname, lname, phone, sex } = profile;
    const f_name = fname.trim();
    const l_name = lname.trim();
    // find client to use in sequelize transaction and setter for industries (ManyToMany) below
    const staff = await Staff.findOne({
        where: { status: true, id },
    });
    try {
        await db.sequelize.transaction( async (t) => {
            await staff.update({ fname: f_name, lname: l_name, phone, sex }, {
                where: { id },
                returning: true,
                transaction: t
            });
        });
        // fetch updated staff and return
        return await Staff.findByPk(id, {
            where: {status: true},
            attributes: ['id', 'fname', 'lname', 'phone', 'email', 'sex', 'acc_creator', 'status', 'createdAt'],
            include: [
                {
                    model: Authority,
                },
            ]
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
};

const paginateFetch = async (prop) => {
    // page: Current page number (e.g., 1-indexed), pageSize: Number of items per page
    const {page, pageSize, status} = prop; 

    let size = pageSize * 1;    // convert to number
    const offset = (page - 1) * size;
    const s = JSON.parse(status)

    const [results, metadata] = await db.sequelize.query(
        `select a.id, a.fname, a.lname, a.phone, a.email, a.sex, a.status, a.createdAt, b.fname as creator_fname, 
        b.lname as creator_lname from staff b join staff a on a.acc_creator = b.id 
        WHERE a.status = ${status} LIMIT ${size} OFFSET ${offset}`
    );
    const count = await Staff.count({where: {status: s}});
    return {count, results};
}

const search = async (prop) => {
    const { str, status } = prop;
    const [results, metadata] = await db.sequelize.query(
        `select a.id, a.fname, a.lname, a.phone, a.email, a.sex, a.status, a.createdAt, b.fname as creator_fname, 
        b.lname as creator_lname from staff b join staff a on a.acc_creator = b.id 
        WHERE (a.fname LIKE :searchPattern or a.lname LIKE :searchPattern) and a.status = ${status}`, {
            replacements: { 
                searchPattern: `%${str}%` 
            },
        }
    );
    return results;
}

const findAll = async () => {
    return await Staff.findAll({
        attributes: ['id', 'fname', 'lname', 'phone', 'email', 'sex', 'acc_creator', 'status', 'createdAt']
    });
}

const status = async ({id, status}) => {
    await Staff.update( {status}, { where: { id }} );
}

const updateAuthorities = async ({id, authorities}) => {
    try {
        await db.sequelize.transaction( async (t) => {
            // FIRST: delete all previous foles for staff
            await db.sequelize.query(
                'DELETE jt FROM jt_staff_auths as jt WHERE jt.staff_id = :id',
                {
                    replacements: { id },
                    type: QueryTypes.DELETE,
                    transaction: t,
                }
            );
            const auths = [];
            for (const a of authorities) {
                const auth = await Authority.findOne({ where: { code: a.code }}); // may use id too here
                if(!auth) {
                    throw new Error("Invalid authority specified");
                }
                auths.push(auth);
                // await newStaff.addAuthority(auth, { transaction: t });
            }
            // find staff
            const staff = await Staff.findByPk(id);
            await staff.setAuthorities(auths, { transaction: t });
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const register = async (staff, creatorID) => {
    const { fname, lname, phone, email, sex, pw, authorities } = staff;
    const f_name = fname.trim();
    const l_name = lname.trim();
    const mail = email.trim();
    // encrypt password
    const hashedPwd = await bcrypt.hash(pw, 12);
    return await db.sequelize.transaction( async (t) => {
        const newStaff = await Staff.create({ fname: f_name, lname: l_name, phone, pw: hashedPwd, email: mail, status: true, sex, acc_creator: creatorID }, { transaction: t });
        for (const authCode of authorities) {
            const auth = await Authority.findOne({ where: { code: authCode }});
            if(!auth) {
                throw new Error("Invalid authority specified");
            }
            await newStaff.addAuthority(auth, { transaction: t });
        }
        return newStaff;
    } );
};

const deleteAccount = async (email) => {
    await db.sequelize.transaction( async (t) => {
        await Staff.destroy( {
            where: {  email },
            force: true,
        } );
    } );
};

const updateEmail = async (id, email) => {
    const mail = email.trim();
    // find client from db using id in request parameter
    const client = await Staff.findOne({ where: {status: true, id} });
    if(!client) {
        throw new Error("Account Not Found");
    }
    try {
        await db.sequelize.transaction( async (t) => {
            await Staff.update({ email: mail }, {
                where: { id },
                returning: true,
                transaction: t
            });
            // delete mail_otp assiciated with email
            await MailOTP.destroy({ where: { email } }, { transaction: t });
        });
        return await Staff.findByPk(id, {
            where: {status: true},
            attributes: ['id', 'fname', 'lname', 'phone', 'email', 'sex', 'acc_creator', 'status', 'createdAt'],
            include: [
                {
                    model: Authority,
                },
            ]
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const updatePassword = async (id, data) => {
    const { pw, current_pw } = data;
    // find client from db using id in request parameter
    const staff = await Staff.findOne({
        where: { status: true, id },
    });
    if(!staff) {
        throw new Error("Invalid operation");
    }
    // check if current password is correct
    // if match, then compare password
    const match = await bcrypt.compare(decrypt(current_pw), staff.pw);
    if(match) {
        // encrypt password
        const hashedPwd = await bcrypt.hash(decrypt(pw), 12);
        await Staff.update({ pw: hashedPwd }, {
            where: { id },
        });
    }else {
        throw new Error("Invalid password");
    }
};

const resetPassword = async (data) => {
    const staff = await Staff.findOne({ 
        where: { email: data.email.trim() },
    });

    if (!staff) {
        throw new Error("Invalid credentials");
    }

    if(staff.fname === data.fname.trim() && staff.lname === data.lname.trim()){
        const pw = new Date().toLocaleDateString('en-us', { weekday: 'short' }).toUpperCase() + generateOTP(6);

        // encrypt password
        const hashedPwd = await bcrypt.hash(pw, 12);
        await Staff.update({ pw: hashedPwd }, {
            where: { email: data.email },
        });
        
        return pw;
    }else {
        throw new Error("Invalid credentials");
    }
}

const countUnverifiedMails = async () => {
    return await otpMailService.count();
}

const countActiveStaff = async () => {
    return await Staff.count({where: {status: true}});
}

const getAuthorities = async () => {
    return await Authority.findAll();
};

/*  method to initialize Users page with 100 active users to use as defaultOptions for AsyncSelect
    and also count total active users for pagination component */
const activeStaffPageInit = async (pageSize) => {
    const [results, metadata] = await db.sequelize.query(
        `select a.id, a.fname, a.lname, a.phone, a.email, a.sex, a.status, a.createdAt, b.fname as creator_fname, 
        b.lname as creator_lname from staff b join staff a on a.acc_creator = b.id WHERE a.status = ${'true'} 
        LIMIT ${pageSize}`
    );
    const count = await Staff.count({where: {status: true}});
    return {count, results};
}

module.exports = {
    findById,
    findByIdWithAuths,
    deleteAccount,
    findByEmail,
    dashboardInfo,
    updateAuthorities,
    register,
    updateEmail,
    updatePassword,
    resetPassword,
    findAll,
    status,
    countUnverifiedMails,
    countActiveStaff,
    getAuthorities,
    activeStaffPageInit,
    updatePersonalInfo,
    paginateFetch,
    search,
};