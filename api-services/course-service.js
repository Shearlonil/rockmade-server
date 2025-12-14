const db = require('../config/entities-config');
const { QueryTypes } = db.sequelize;
const { Op } = require('sequelize');

const Course = db.courses;
const Staff = db.staff;
const Hole = db.holes;
const Contest = db.contests;
const CourseHole = db.courseHoles;
const HoleContest = db.holesContests;

const findById = async (id) => {
    return await Course.findByPk(id,
        { 
            include: [
                {
                    model: Hole,
                    as: 'holes',
                    include: [
                        { 
                            model: Contest,
                            as: 'contests',
                            through: {
                                where: {
                                    course_id: id,
                                }
                            },
                        }
                    ],
                },
            ]
        }
    );
}

const paginateFetch = async (prop) => {
    // page: Current page number (e.g., 1-indexed), pageSize: Number of items per page
    const {page, pageSize, status} = prop; 

    let size = pageSize * 1;    // convert to number
    const offset = (page - 1) * size;
    const s = JSON.parse(status);

    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.no_of_holes, c.location, c.status, c.createdAt, s.fname, s.lname, s.sex, s.email, s.phone FROM courses c inner join staff s on 
        c.creator_id = s.id WHERE c.status = :s LIMIT :size OFFSET :offset`, {
            replacements: { 
                size, s, offset
            },
        }
    );
    const count = await Course.count({where: {status: s}});
    return {count, results};
}

const search = async (prop) => {
    const { str, status } = prop;
    const s = JSON.parse(status);
    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.no_of_holes, c.location, c.status, c.createdAt, s.fname, s.lname, s.sex, s.email, s.phone FROM courses c inner join staff s on 
        c.creator_id = s.id WHERE c.name LIKE :searchPattern and c.status = :s`, {
            replacements: { 
                searchPattern: `%${str}%`,
                s,
            },
        }
    );
    return results;
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
                    const h = await Hole.findOne({
                        where: { 
                            hole_no,
                        },
                    });
                    await CourseHole.create({ hole_id: h.id, hcp_idx: hcp, par, course_id: c.id }, { transaction: t });
                    for (const id of contests) {
                        const contest = await Contest.findByPk(id);
                        if(contest){
                            await HoleContest.create({hole_id: h.id, contest_id: contest.id, course_id: c.id}, { transaction: t });
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

const updateCourseHole = async (course) => {
    try {
        const { course_id, hole_id, hcp, par } = course;
        const [results, metadata] = await  db.sequelize.query(
            `UPDATE course_holes SET hcp_idx = :hcp, par = :par WHERE id = :hole_id and course_id = :course_id`,
        {
          replacements: { hcp, par, hole_id, course_id },
          type: QueryTypes.UPDATE, // Specify the query type
        }
      );
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
                const c = await Course.findByPk(course_id);
                if(c === null){
                    throw new Error("Course not found");
                }
                // FIRST: delete all contests associated with previous holes for this course
                await db.sequelize.query(
                    'DELETE jt FROM jt_holes_contests as jt inner join holes as h on h.id = jt.hole_id and jt.course_id = :course_id WHERE h.course_id = :course_id',
                    {
                        replacements: { course_id },
                        type: QueryTypes.DELETE,
                        transaction: t,
                    }
                );
                // SECOND: delete all previous holes for this course
                await db.sequelize.query(
                    'DELETE FROM course_holes WHERE course_holes.course_id = :course_id',
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
                    const h = await Hole.findOne({
                        where: { 
                            hole_no,
                        },
                    });
                    await CourseHole.create({ hole_id: h.id, hcp_idx: hcp, par, course_id: c.id }, { transaction: t });
                    holesArr.push(h);
                }
                // LAST: update hole count (no_of_holes field) in course table
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

const gameCourseSearch = async (str) => {
    return await Course.findAll(
        { 
            where: { 
                status: true,
                name: {
                    [Op.like]: `%${str}%`
                }
            },
            include: [
                {
                    model: Hole,
                    as: 'holes',
                },
            ]
        }
    );
}

const limitGameCourseSearch = async (pageSize) => {
    /*  Relation's attribute in top level where clause with limit throws exception.
        Fix is to add the duplicating attribute with value false in the include attribute
        refs:
        https://github.com/sequelize/sequelize/issues/15121
        https://github.com/sequelize/sequelize/issues/3007
        https://github.com/sequelize/sequelize/blob/master/test/integration/include/findAll.test.js#L1186
    */
    let limit = pageSize * 1;    // convert to number
    return await Course.findAll(
        { 
            where: { 
                status: true,
            },
            include: [
                {
                    model: Hole,
                    as: 'holes',
                },
            ],
            limit,
        }
    );
}

const findAllActive = async () => {
    return await Course.findAll(
        { 
            where: { status: true },
            include: [
                {
                    model: Hole,
                    as: 'holes',
                },
            ]
        }
    );
}

/*  method to initialize Course page with 100 active courses to use as defaultOptions for AsyncSelect
    and also count total active courses for pagination component */
const activeCoursesPageInit = async (pageSize) => {
    let size = pageSize * 1;    // convert to number
    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.no_of_holes, c.location, c.status, c.createdAt, s.fname, s.lname, s.sex, s.email, s.phone FROM courses c inner join staff s on 
        c.creator_id = s.id WHERE c.status = ${'true'} LIMIT :size`, {
            replacements: { 
                size,
            },
        }
    );
    const count = await Course.count({where: {status: true}});
    return {count, results};
}

/*  method to initialize Course page with 100 inactive courses to use as defaultOptions for AsyncSelect
    and also count total inactive courses for pagination component */
const inactiveCoursesPageInit = async (pageSize) => {
    let size = pageSize * 1;    // convert to number
    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.no_of_holes, c.location, c.status, c.createdAt, s.fname, s.lname, s.sex, s.email, s.phone FROM courses c inner join staff s on 
        c.creator_id = s.id WHERE c.status = ${'false'} LIMIT :size`, {
            replacements: { 
                size,
            },
        }
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

/*  method to initialize Courses in plaer reg page with 20 active courses to use as defaultOptions for AsyncSelect
    and also count total active courses for pagination component */
const onboardingCoursesInit = async () => {
    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.no_of_holes, c.location FROM courses c WHERE c.status = ${'true'} LIMIT 20`
    );
    return results;
}

const onboardingCourseSearch = async (prop) => {
    const { str } = prop;
    const [results, metadata] = await db.sequelize.query(
        `SELECT c.id, c.name, c.no_of_holes, c.location FROM courses c WHERE c.name LIKE :searchPattern and c.status = ${'true'}`, {
            replacements: { 
                searchPattern: `%${str}%`,
            },
        }
    );
    return results;
}

module.exports = {
    findById,
    search,
    paginateFetch,
    createGolfCourse,
    updateCourse,
    updateCourseHole,
    updateCourseHoleCount,
    gameCourseSearch,
    limitGameCourseSearch,
    findAllActive,
    activeCoursesPageInit,
    inactiveCoursesPageInit,
    status,
    onboardingCoursesInit,
    onboardingCourseSearch,
};