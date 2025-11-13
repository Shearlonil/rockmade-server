const db = require('../config/entities-config');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { subDays } = require('date-fns');

const generateOTP = require('../utils/otp-generator');
const {compress, encodeImageToBlurhash} = require('../utils/img-compression-agent');

const User = db.users;
const Course = db.courses;
const Country = db.countries;
const MailOTP = db.mailOTP;
const BlurHash = db.blurHash;

const findById = async id => {
    return await User.findByPk(id, {
        attributes: ['id', 'fname', 'lname', 'sub_expiration', 'email', 'gender', 'phone', 'status', 'hcp', ],
        include: [
            {
                model: Course,
                where: { status : true },
            },
            {
                model: BlurHash,
            }
        ]
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
                model: BlurHash,
            }
        ]
    });
};

// only useful for updating password
const findForPassWord = async id => {
    return await User.findByPk(id);
};

const updateEmail = async (id, email) => {
    const mail = email.trim();
    // find client from db using id in request parameter
    const client = await User.findByPk(id);
    if(!client) {
        throw new Error("Account Not Found");
    }
    try {
        await db.sequelize.transaction( async (t) => {
            await User.update({ email: mail }, {
                where: { id },
                returning: true,
                transaction: t
            });
            // delete mail_otp assiciated with email
            await MailOTP.destroy({ where: { email } }, { transaction: t });
            return await findById(id);
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const updatePassword = async (id, pw) => {
    // encrypt password
    const hashedPwd = await bcrypt.hash(pw, 12);
    await User.update({ pw: hashedPwd }, {
        where: { id },
    });
}

const resetPassword = async (data) => {
    const user = await User.findOne({ 
        where: { email: data.email.trim() },
    });

    if (!client) {
        throw new Error("Invalid credentials");
    }

    if(client.fname === data.fname.trim() && client.lname === data.lname.trim()){
        const pw = new Date().toLocaleDateString('en-us', { weekday: 'short' }).toUpperCase() + generateOTP(6);

        // encrypt password
        const hashedPwd = await bcrypt.hash(pw, 12);
        await User.update({ pw: hashedPwd }, {
            where: { email: data.email },
        });
        
        return pw;
    }else {
        throw new Error("Invalid credentials");
    }
}

const register = async client => {
    const { fname, lname, pw, email, gender, phone, hcp, hc_id, country_id, dp } = client;
    const f_name = fname.trim();
    const l_name = lname.trim();
    const mail = email.trim();
    // find if email is already registered
    const user = await User.findOne({ where: { email } });
    const course =  await Course.findByPk(hc_id);
    const country = await Country.findByPk(country_id);
    
    if(user) {
        throw new Error("Email is already registered");
    }
    
    if(course === null) {
        throw new Error("Invalid Golf Course specified as Home Club");
    }
    
    if(country === null) {
        throw new Error("Invalid Country specified");
    }

    const yesterday = subDays(new Date(), 1); // Subtracts 1 day from today to use as sub_expiration

    // encrypt password
    const hashedPwd = await bcrypt.hash(pw, 12);
    try {
        return await db.sequelize.transaction( async (t) => {
            const c = await User.create(
                { fname: f_name, lname: l_name, pw: hashedPwd, email: mail, status: true, gender, phone, hcp, course_id: hc_id, sub_expiration: yesterday, country_id }
                , { transaction: t }
            );
            if(dp){
                client.id = c.id;
                const buf = await compress(path.join(__dirname, "..", "file-upload", dp.filename));
                await fsPromises.writeFile(path.join(__dirname, "..", "dp-upload", c.id + '.webp'), buf, {encoding: 'base64', flag: 'w'});
                const encodedHash = await encodeImageToBlurhash(path.join(__dirname, "..", "dp-upload", c.id + '.webp'));
                await BlurHash.create({blur_hash: encodedHash.hash, user_id: c.id}, { transaction: t });
            }
            // delete mail_otp assiciated with email
            await MailOTP.destroy({ where: { email } }, { transaction: t });
            return c;
        });
    } catch (error) {
        if(dp && fs.existsSync(path.join(__dirname, "..", "dp-upload", client.id + '.webp' )) ){
            // delete compressed image
            await fsPromises.unlink(path.join(__dirname, "..", "dp-upload", client.id + '.webp'));
        }
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
};

const update = async (id, profile) => {
    const { fname, lname, phone, gender, hcp, hc_id, country_id } = profile;
    const f_name = fname.trim();
    const l_name = lname.trim();

    const course =  await Course.findByPk(hc_id);
    const country = await Country.findByPk(country_id);
    
    if(course === null) {
        throw new Error("Invalid Golf Course specified as Home Club");
    }
    
    if(country === null) {
        throw new Error("Invalid Country specified");
    }
    // find client to use in sequelize transaction and setter for industries (ManyToMany) below
    const client = await User.findByPk(id);
    try {
        await db.sequelize.transaction( async (t) => {
            await client.update({ fname: f_name, lname: l_name, phone, gender, hcp, course_id: hc_id, country_id }, {
                where: { id },
                returning: true,
                transaction: t
            });
        });
        // fetch updated client and return
        return await findById(id);
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
};

const changePassword = async (id, profile) => {
    const { newPass } = profile;
    // encrypt password
    const hashedPwd = await bcrypt.hash(newPass, 12);
    await User.update({ pw: hashedPwd }, {
        where: { id },
        returning: true,
    });
    // fetch updated client and return
    return await findById(id);
};

const myJobs = async (id) => {
    const client = await User.findByPk(id);
    /*
    , {
        include: [
            {
                model: JobAdvert,
            },
            {
                model: JobAdvert,
                as: 'advert',
            },
        ]
    }
    */
    if(client.acc_type === 'E') {
        // find posted jobs by employer
        const jobs = await client.getJobAdverts({
            include: [
                {
                    model: JobLocation,
                },
                {
                    model: JobIndustry,
                },
            ]
        });
        return jobs
    }else {
        // find jobs applied by client
        const jobs = await client.getAdvert({
            include: [
                {
                    model: JobLocation,
                },
                {
                    model: JobIndustry,
                },
            ]
        });
        return jobs;
    }
}

const listClients = async ( {name, idOffset, limit, acc_type}, pageSpan ) => {
    const where = {
        [Op.or]: [
            { 
                fname: {
                    [Op.like]: `%${name != undefined ? name : ''}%`,
                }
            }, 
            { 
                lname: {
                    [Op.like]: `%${name != undefined ? name : ''}%`,
                },
             }
        ],
        acc_type,
        id: {
            [Op.gt] : idOffset
        }
    };

    const clients = await Client.findAll(
        { 
            where, 
            limit: limit * pageSpan,
        }
    );

    // count total jobs found for this query. 
    const count = await User.count({
        where
    });

    return { clients, count };
};

const changeClientStatus = async ({id, status}) => {
    const client = await User.findByPk(id);
    client.status = status;
    return await client.save();
}

const removeMyIndustry = async (client_id, industry_id) => {
    const client = await findById(client_id);
    const industry = await JobIndustry.findByPk(industry_id);
    if (!industry) {
        throw new Error('Industry not found');
    }
    await client.removeJobIndustry(industry);
}

// PRIVATE METHODS START HERE

module.exports = {
    findById,
    findByEmail,
    register,
    update,
    findForPassWord,
    updateEmail,
    updatePassword,
    resetPassword,
    changePassword,
    myJobs,
    listClients,
    changeClientStatus,
    removeMyIndustry,
};