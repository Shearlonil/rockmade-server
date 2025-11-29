const db = require('../config/entities-config');
const { QueryTypes } = db.sequelize;

const Course = db.courses;
const Staff = db.staff;
const Hole = db.holes;
const Contest = db.contests;

const findById = async (id) => {
    return await Course.findByPk(id,
        { 
            include: [
                {
                    model: Hole,
                    include: [
                        { 
                            model: Contest,
                            as: 'contest'
                        }
                    ],
                },
            ]
        }
    );
}

const createGolfCourse = async (creator_id, course) => {
    try {
        const { name, hole_count, location, holes } = course;

        if(holes.length === 9 || holes.length === 18){
            const creator = await Staff.findByPk(creator_id);
            await db.sequelize.transaction( async (t) => {
                const c = await Course.create( { name, no_of_holes: hole_count, location, creator_id: creator.id }, { transaction: t });
                    
                for (const hole of holes) {
                    const { hole_no, hcp, par, contests = [] } = hole;
                    const h = await Hole.create({ hole_no, hcp_idx: hcp, par, course_id: c.id }, { transaction: t });
                    for (const id of contests) {
                        const contest = await Contest.findByPk(id);
                        if(contest){
                            await h.addContest(contest, { transaction: t });
                        }else {
                            throw new Error("Invalid Contest specified for hole " + hole_no);
                        }
                    }
                }
            });
        }else {
            throw new Error("Invalid number of holes specified");
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const updateCourse = async (course) => {
    try {
        const { name, location, id } = course;
        const c = await Course.findByPk(id);
        if(c === null){
             throw new Error("Course not found");
        }
        await Course.update({ name, location }, {
            where: { id },
            returning: true,
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const updateCourseHoleCount = async (course) => {
    try {
        const { course_id, holes } = course;

        if(holes.length === 9 || holes.length === 18){
            return await db.sequelize.transaction( async (t) => {
                // FIRST: delete all contests associated with previous holes for this course
                await db.sequelize.query(
                    'DELETE jt FROM jt_holes_contests as jt inner join holes as h on h.id = jt.hole_id WHERE h.course_id = :course_id',
                    {
                        replacements: { course_id },
                        type: QueryTypes.DELETE,
                        transaction: t,
                    }
                );
                // SECOND: delete all previous holes for this course
                await db.sequelize.query(
                    'DELETE FROM holes WHERE holes.course_id = :course_id',
                    {
                        replacements: { course_id },
                        type: QueryTypes.DELETE,
                        transaction: t,
                    }
                );

                // THIRD: create new holes
                const holesArr = [];
                for (const hole of holes) {
                    const { hole_no, hcp, par } = hole;
                    const h = await Hole.create({ hole_no, hcp_idx: hcp, par, course_id }, { transaction: t });
                    holesArr.push(h);
                }

                // LAST: update hole count (no_of_holes field) in course table
                const c = await Course.findByPk(course_id);
                if(c === null){
                    throw new Error("Course not found");
                }
                await Course.update({ no_of_holes: holes.length }, {
                    where: { id: course_id },
                    transaction: t,
                    returning: true,
                });
                return holesArr;
            });
        }else {
            throw new Error("Invalid number of holes specified");
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

const findAllActiveGolfCoursesForGame = async () => {
    return await Course.findAll(
        { 
            where: { status: true },
            include: [
                {
                    model: Hole,
                    include: [
                        { 
                            model: Contest,
                            as: 'contest'
                        }
                    ],
                },
            ]
        }
    );
}

const findAllActiveGolfCoursesForReg = async () => {
    return await Course.findAll(
        { 
            where: { status: true },
        }
    );
}

/*  method to initialize Course page with 100 active courses to use as defaultOptions for AsyncSelect
    and also count total active courses for pagination component */
const activeCoursesPageInit = async () => {
    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.no_of_holes, c.location, c.createdAt, s.fname, s.lname, s.sex, s.email, s.phone FROM courses c inner join staff s on c.creator_id = s.id WHERE c.status = ${'true'} LIMIT 100`
    );
    const count = await Course.count({where: {status: true}});
    return {count, results};
}

/*  method to initialize Course page with 100 inactive courses to use as defaultOptions for AsyncSelect
    and also count total inactive courses for pagination component */
const inactiveCoursesPageInit = async () => {
    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.no_of_holes, c.location, c.createdAt, s.fname, s.lname, s.sex, s.email, s.phone FROM courses c inner join staff s on c.creator_id = s.id WHERE c.status = ${'false'} LIMIT 100`
    );
    const count = await Course.count({where: {status: false}});
    return {count, results};
}

const status = async (contest) => {
    try {
        const { status, id } = contest;
        const c = await Course.findByPk(id);
        if(c === null){
             throw new Error("Course not found");
        }
        await Course.update({ status }, {
            where: { id },
            returning: true,
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        throw new Error(error.message); // rethrow the error for front-end 
    }
}

module.exports = {
    findById,
    createGolfCourse,
    updateCourse,
    updateCourseHoleCount,
    findAllActiveGolfCoursesForGame,
    findAllActiveGolfCoursesForReg,
    activeCoursesPageInit,
    inactiveCoursesPageInit,
    status,
};