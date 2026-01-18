const db = require('../config/entities-config');
const { QueryTypes } = db.sequelize;
const bcrypt = require('bcryptjs');

const otpMailService = require('./mail-otp-service');
const { generateOTP } = require('../utils/otp-generator');

const Staff = db.staff;
const Authority = db.staffAuths;

const findById = async id => {
    return await Staff.findByPk(id, {
        attributes: ['id', 'fname', 'lname', 'phone', 'email', 'sex', 'acc_creator', 'status', 'createdAt'],
        include: {
            model: Authority,
        }
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
    return staff;
};

const findByEmail = async email => {
    return await Staff.findOne({ 
        where: { email },
        include: {
            model: Authority,
        }
    });
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

const update = async (id, profile) => {
    const { fname, lname, email, sex, phone } = profile;
    const f_name = fname.trim();
    const l_name = lname.trim();
    const mail = email.trim();
    await Staff.update({ fname: f_name, lname: l_name, email: mail, sex, phone }, {
        where: { id },
        returning: true,
    });
    // fetch updated staff and return
    return await findById(id);
};

// only useful for updating password
const findForPassWord = async id => {
    return await Staff.findByPk(id);
};

const updatePassword = async (id, newPass) => {
    // encrypt password
    const hashedPwd = await bcrypt.hash(newPass, 12);
    await Staff.update({ pw: hashedPwd }, {
        where: { id },
        returning: true,
    });
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
    updateAuthorities,
    register,
    update,
    findForPassWord,
    updatePassword,
    resetPassword,
    findAll,
    status,
    countUnverifiedMails,
    countActiveStaff,
    getAuthorities,
    activeStaffPageInit,
    paginateFetch,
    search,
};