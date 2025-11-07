const db = require('../config/db-config');
const bcrypt = require('bcryptjs');
const otpMailService = require('./mail-otp-service');
const generateOTP = require('../utils/otp-generator');

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

const findByIdWithCreator = async id => {
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

const listStaff = async ( {offset, limit, status} ) => {
    return await Staff.findAll(
        { 
            where: { status }, 
            offset, 
            limit
        }
    );
}

const findAll = async () => {
    return await Staff.findAll({
        attributes: ['id', 'fname', 'lname', 'phone', 'email', 'sex', 'acc_creator', 'status', 'createdAt']
    });
}

const changeStaffStatus = async ({staff_id, status}) => {
    await Staff.update( {status}, { where: { id: staff_id }} );
}

const updateAuthorities = async ({staff_id, authorities}) => {
    // find associated industries
    const auths = [];

    for (const authority of authorities) {
        const auth = await Authority.findOne({ where: { code: authority }});
        if(!auth) {
            throw new Error("Invalid authority specified with");
        }
        auths.push(auth);
    }
    // find staff
    const staff = await Staff.findByPk(staff_id);
    await staff.setAuthorities(auths);
}

const register = async (staff, creatorID) => {
    const { fname, lname, phone, email, sex, pw, authorities } = staff;
    const f_name = fname.trim();
    const l_name = lname.trim();
    const mail = email.trim();
    // encrypt password
    const hashedPwd = await bcrypt.hash(pw, 12);
    await db.sequelize.transaction( async (t) => {
        const newStaff = await Staff.create({ fname: f_name, lname: l_name, phone, pw: hashedPwd, email: mail, status: true, sex, acc_creator: creatorID }, { transaction: t });
        for (const authority of authorities) {
            const auth = await Authority.findOne({ where: { code: authority.value }});
            if(!auth) {
                throw new Error("Invalid authority specified");
            }
            await newStaff.addAuthority(auth, { transaction: t });
        }
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

module.exports = {
    findById,
    findByIdWithCreator,
    deleteAccount,
    findByEmail,
    updateAuthorities,
    register,
    update,
    findForPassWord,
    updatePassword,
    resetPassword,
    listStaff,
    findAll,
    changeStaffStatus,
    countUnverifiedMails,
    countActiveStaff,
    getAuthorities,
};