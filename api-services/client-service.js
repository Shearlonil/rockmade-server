const db = require('../config/db-config');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const generateOTP = require('../utils/otp-generator');

const Client = db.clients;
const SeekerInfo = db.seekerInfo;
const EmployerInfo = db.employerInfo;
const JobIndustry = db.jobIndustry;
const CertQualification = db.certQualification;
const JobExperience = db.jobExperience;
const JobLocation = db.jobLocation;
const MailOTP = db.mailOTP;

const findById = async id => {
    return await Client.findByPk(id, {
        attributes: ['id', 'fname', 'lname', 'acc_type', 'email', 'sex', 'phone', 'status', ],
        include: [
            {
                model: SeekerInfo,
            },
            {
                model: EmployerInfo,
            },
            {
                model: JobIndustry,
                where: { status : true },
            }
        ]
    });
};

const findByEmail = async email => {
    return await Client.findOne({ 
        where: { email },
        include: [
            {
                model: SeekerInfo,
            },
            {
                model: EmployerInfo,
            },
            {
                model: JobIndustry,
            }
        ]
    });
};

// only useful for updating password
const findForPassWord = async id => {
    return await Client.findByPk(id);
};

const updateEmail = async (id, email) => {
    const mail = email.trim();
    try {
        await db.sequelize.transaction( async (t) => {
            await Client.update({ email: mail }, {
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
    await Client.update({ pw: hashedPwd }, {
        where: { id },
    });
}

const resetPassword = async (data) => {
    const client = await Client.findOne({ 
        where: { email: data.email.trim() },
    });

    if (!client) {
        throw new Error("Invalid credentials");
    }

    if(client.fname === data.fname.trim() && client.lname === data.lname.trim()){
        const pw = new Date().toLocaleDateString('en-us', { weekday: 'short' }).toUpperCase() + generateOTP(6);

        // encrypt password
        const hashedPwd = await bcrypt.hash(pw, 12);
        await Client.update({ pw: hashedPwd }, {
            where: { email: data.email },
        });
        
        return pw;
    }else {
        throw new Error("Invalid credentials");
    }
}

const registerSeeker = async client => {
    const { fname, lname, pw, email, sex, phone, preferred_location, highest_qualification, experience, cv, industries, cv_ext } = client;
    const f_name = fname.trim();
    const l_name = lname.trim();
    const mail = email.trim();
    // find if email is already registered
    const seeker = await Client.findOne({ where: { email } });
    
    if(seeker) {
        throw new Error("Email is already registered");
    }
    // find associated industries
    const sectors = [];

    for (const industry_id of industries) {
        // ignore the make shift from front end
        if(industry_id === 0){
            continue;
        }
        const sector = await JobIndustry.findByPk(industry_id, { where: { status: true } } );
        if(sector){
            sectors.push( sector.dataValues.id );
        }
    }
    if(sectors.length < 1) {
        throw new Error("At least one industry is required");
    }

    const experience_supplied = await JobExperience.findOne({ where: { name: experience } });
    if(!experience_supplied){
        throw new Error("Invalid job experience level provided");
    }

    const qualification_supplied = await CertQualification.findOne({ where: { name: highest_qualification } });
    if(!qualification_supplied){
        throw new Error("Invalid qualification provided");
    }

    const location_supplied = await JobLocation.findOne({ where: { name: preferred_location } });
    if(!location_supplied){
        throw new Error("Invalid location provided");
    }

    // encrypt password
    const hashedPwd = await bcrypt.hash(pw, 12);
    try {
        return await db.sequelize.transaction( async (t) => {
            const client = await Client.create({ fname: f_name, lname: l_name, pw: hashedPwd, email: mail, status: true, sex, phone, acc_type: 'S' }, { transaction: t });
            // set the OneToOne relationship
            await client.createSeekerInfo({ preferred_location, highest_qualification, years_of_experience: experience, cv, cv_ext }, { transaction: t });
            // link with industries
            sectors.forEach( async industry => {
                await client.addJobIndustry(industry, { transaction: t });
            } );
            // delete mail_otp assiciated with email
            await MailOTP.destroy({ where: { email } }, { transaction: t });
            return client;
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
};

const registerEmployer = async client => {
    const { fname, lname, pw, email, sex, phone, company_name, address, company_email, industries } = client;
    const f_name = fname.trim();
    const l_name = lname.trim();
    const mail = email.trim();
    // find if email is already registered
    const employer = await Client.findOne({ where: { email } });
    if(employer) {
        throw new Error("Email is already registered");
    }

    // find associated industries
    const sectors = [];

    for (const industry_id of industries) {
        // ignore the make shift from front end
        if(industry_id === 0){
            continue;
        }
        const sector = await JobIndustry.findByPk(industry_id, { where: { status: true } } );
        if(sector){
            sectors.push( sector.dataValues.id );
        }
    }
    if(sectors.length < 1) {
        throw new Error("At least one industry is required");
    }
    // encrypt password
    const hashedPwd = await bcrypt.hash(pw, 12);
    try {
        return await db.sequelize.transaction( async (t) => {
            const client = await Client.create({ fname: f_name, lname: l_name, pw: hashedPwd, email: mail, status: true, sex, phone, acc_type: 'E' }, { transaction: t });
            // set the OneToOne relationship
            await client.createEmployerInfo({ company_name, address, company_email }, { transaction: t });
            // link with industries
            sectors.forEach( async industry => {
                await client.addJobIndustry(industry, { transaction: t });
            } );
            // delete mail_otp assiciated with email
            await MailOTP.destroy({ where: { email } }, { transaction: t });
            return client;
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
};

const update = async (id, profile) => {
    const { fname, lname, phone, sex, industries, preferred_location, highest_qualification, experience, company_name, address, company_email, cv, cv_ext } = profile;
    const f_name = fname.trim();
    const l_name = lname.trim();
    // find client to use in sequelize transaction and setter for industries (ManyToMany) below
    const client = await Client.findByPk(id);
    try {
        await db.sequelize.transaction( async (t) => {
            await client.update({ fname: f_name, lname: l_name, phone, sex }, {
                where: { id },
                returning: true,
                transaction: t
            });

            // find associated industries
            const sectors = [];
        
            for (const industry_id of industries) {
                // ignore the make shift from front end
                if(industry_id === 0){
                    continue;
                }
                const sector = await JobIndustry.findByPk(industry_id, { where: { status: true } } );
                if(sector){
                    sectors.push( sector.dataValues.id );
                }
            }
            if(sectors.length < 1) {
                throw new Error("At least one industry is required");
            }
            // update industries
            await client.setJobIndustries(sectors, { transaction: t });

            if(client.acc_type === 'E'){
                // if client is an employer, update employer info
                await updateEmployer(t, id, company_name, address, company_email);
            }else {
                // seeker found, update
                const experience_supplied = await JobExperience.findOne({ where: { name: experience } });
                if(!experience_supplied){
                    throw new Error("Invalid job experience level provided");
                }

                const qualification_supplied = await CertQualification.findOne({ where: { name: highest_qualification } });
                if(!qualification_supplied){
                    throw new Error("Invalid qualification provided");
                }

                const location_supplied = await JobLocation.findOne({ where: { name: preferred_location } });
                if(!location_supplied){
                    throw new Error("Invalid location provided");
                }
                await updateSeeker(t, id, preferred_location, highest_qualification, experience, cv, cv_ext);
            }
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
    await Client.update({ pw: hashedPwd }, {
        where: { id },
        returning: true,
    });
    // fetch updated client and return
    return await findById(id);
};

const myJobs = async (id) => {
    const client = await Client.findByPk(id);
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
    const count = await Client.count({
        where
    });

    return { clients, count };
};

const changeClientStatus = async ({id, status}) => {
    const client = await Client.findByPk(id);
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

const updateSeeker = async ( t, client_id, preferred_location, highest_qualification, years_of_experience, cv, cv_ext ) => {
    await SeekerInfo.update({ preferred_location, highest_qualification, years_of_experience, cv, cv_ext }, {
        where: { client_id },
        returning: true,
        transaction: t
    });
};

const updateEmployer = async ( t, client_id, company_name, address, company_email ) => {
    await EmployerInfo.update({ company_name, address, company_email }, {
        where: { client_id },
        returning: true,
        transaction: t
    });
};

module.exports = {
    findById,
    findByEmail,
    registerSeeker,
    registerEmployer,
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