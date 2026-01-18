const { Op, Sequelize } = require('sequelize');
const sequelize = require('./sequelize-db-connect');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Op;

db.users = require('../entities/users')(sequelize, Sequelize);
db.imgKeyHash = require('../entities/profile_key_hash')(sequelize, Sequelize);
db.courses = require('../entities/courses')(sequelize, Sequelize);
db.games = require('../entities/games')(sequelize, Sequelize);
db.gameCodes = require('../entities/game-codes')(sequelize, Sequelize);
db.holes = require('../entities/holes')(sequelize, Sequelize);
db.courseHoles = require('../entities/course-holes')(sequelize, Sequelize);
db.contests = require('../entities/contests')(sequelize, Sequelize);
db.courseHolesContests = require('../entities/course-holes-contests')(sequelize, Sequelize, db.holes, db.contests, db.courses);
db.userGameGroup = require('../entities/user-game-group')(sequelize, Sequelize);
db.gameHoleRecords = require('../entities/game-hole-records')(sequelize, Sequelize);
db.userHoleContestScores = require('../entities/user-hole-contest-scores')(sequelize, Sequelize);
db.gameHoleContests = require('../entities/game-hole-contest')(sequelize, Sequelize);
db.holeScores = require('../entities/user-hole-scores')(sequelize, Sequelize);
db.staff = require('../entities/staff')(sequelize, Sequelize);
db.staffAuths = require('../entities/staff-authority')(sequelize, Sequelize);
db.tblJoinStaffAuths = require('../entities/tblJoinStaffAuths')(sequelize, Sequelize, db.staff, db.staffAuths);
db.mailOTP = require('../entities/mail-otp')(sequelize, Sequelize);
db.countries = require('../entities/countries')(sequelize, Sequelize);
db.termsAndAgreement = require('../entities/terms-and-agreement')(sequelize, Sequelize);
db.notifications = require('../entities/notification')(sequelize, Sequelize);

// OneToMany relationship between staff and courses
db.staff.hasMany(db.courses, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'creator_id',
        allowNull: false,
    }
});
db.courses.belongsTo(db.staff, {
    foreignKey: {
        name: 'creator_id',
        allowNull: false,
    }
});

// OneToMany relationship between countries and users
db.countries.hasMany(db.users, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'country_id',
        allowNull: false,
    }
});
db.users.belongsTo(db.countries, {
    foreignKey: {
        name: 'country_id',
        allowNull: false,
    }
});

// OneToOne relationship between client and their dp's (if any) imgKeyhash
db.users.hasOne(db.imgKeyHash, {
    onDelete: 'CASCADE',
    foreignKey: {
        name: 'user_id',
        allowNull: false
    }
});
db.imgKeyHash.belongsTo(db.users, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column ClientId
        name: 'user_id',
        allowNull: false
    }
});

// OneToMany relationship between courses and users specifying Home club
db.courses.hasMany(db.users, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'course_id',
        allowNull: false,
    }
});
db.users.belongsTo(db.courses, {
    foreignKey: {
        name: 'course_id',
        allowNull: false,
    }
});

// ManyToMany relationship between courses and holes
db.courses.belongsToMany(db.holes, {
    as: 'holes',
    through: db.courseHoles,
    foreignKey: 'course_id',
    otherKey: 'hole_id',
    onDelete: 'CASCADE',
});
db.holes.belongsToMany(db.courses, {
    as: 'courses',
    through: db.courseHoles,
    foreignKey: 'hole_id',
    otherKey: 'course_id',
});

// OneToMany relationship between courses and games
db.courses.hasMany(db.games, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'course_id',
        allowNull: false,
    }
});
db.games.belongsTo(db.courses, {
    foreignKey: {
        name: 'course_id',
        allowNull: false,
    }
});

// OneToOne relationship between ongoing games and codes
db.games.hasOne(db.gameCodes, {
    onDelete: 'CASCADE',
    foreignKey: {
        name: 'game_id',
        allowNull: false
    }
});
db.gameCodes.belongsTo(db.games, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column GameId
        name: 'game_id',
        allowNull: false
    }
});

// OneToMany relationship between games and gameHoleContests (if any for a game)
db.games.hasMany(db.gameHoleContests, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'game_id',
        allowNull: false,
    }
});
db.gameHoleContests.belongsTo(db.games, {
    foreignKey: {
        name: 'game_id',
        allowNull: false,
    }
});

// OneToMany relationship between games and gameHoleRecords
db.games.hasMany(db.gameHoleRecords, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'game_id',
        allowNull: false,
    }
});
db.gameHoleRecords.belongsTo(db.games, {
    foreignKey: {
        name: 'game_id',
        allowNull: false,
    }
});

// OneToMany relationship between gameHoleRecords and userHoleContestScores
db.gameHoleRecords.hasMany(db.userHoleContestScores, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'game_hole_rec_id',
        allowNull: false,
    }
});
db.userHoleContestScores.belongsTo(db.gameHoleRecords, {
    foreignKey: {
        name: 'game_hole_rec_id',
        allowNull: false,
    }
});

// OneToMany relationship between gameHoleRecords and holeScores
db.gameHoleRecords.hasMany(db.holeScores, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'game_hole_rec_id',
        allowNull: false,
    }
});
db.holeScores.belongsTo(db.gameHoleRecords, {
    foreignKey: {
        name: 'game_hole_rec_id',
        allowNull: false,
    }
});

// OneToMany relationship between staff and contests
db.staff.hasMany(db.contests, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'creator_id',
        allowNull: false,
    }
});
db.contests.belongsTo(db.staff, {
    foreignKey: {
        name: 'creator_id',
        allowNull: false,
    }
});

// OneToMany relationship between users and games (creator of a game)
db.users.hasMany(db.games, {
    as: 'creator',
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'creator_id',
        allowNull: false,
    }
});
db.games.belongsTo(db.users, {
    foreignKey: {
        name: 'creator_id',
        allowNull: false,
    }
});

// ManyToMany relationship between users and games (using groups as user must be in a group to play a game)
db.users.belongsToMany(db.games, {
    as: 'games',
    through: {
        model: db.userGameGroup,
        /*  Disable the default unique constraint which creates constraints using userId and gameId. This isn't
            the desired constraints. Constraints here should be on user_id, game_id, name and round_no all
            defined in the junction table user_game_group declared by userGameGroup
        */
        unique: false,
    },
    foreignKey: 'user_id',
    otherKey: 'game_id',
    onDelete: 'CASCADE',
});
db.games.belongsToMany(db.users, {
    as: 'users',
    through: {
        model: db.userGameGroup,
        /*  Disable the default unique constraint which creates constraints using userId and gameId. This isn't
            the desired constraints. Constraints here should be on user_id, game_id, name and round_no all
            defined in the junction table user_game_group declared by userGameGroup
        */
        unique: false,
    },
    foreignKey: 'game_id',
    otherKey: 'user_id',
});

// ManyToMany relationship between contests and holes of golf courses
db.holes.belongsToMany(db.contests, {
    as: 'contests',
    through: {
        model: db.courseHolesContests,
        /*  Disable the default unique constraint which creates constraints using contest_id and hole_id. This isn't
            the desired constraints. Constraints here should be on contest_id, hole_id and course_is all
            defined in the junction table jt_holes_contests declared by courseHolesContests
        */
        unique: false,
    },
    foreignKey: 'hole_id',
    otherKey: 'contest_id',
    constraints: false,
});
db.contests.belongsToMany(db.holes, {
    as: 'holes',
    through: {
        model: db.courseHolesContests,
        /*  Disable the default unique constraint which creates constraints using contest_id and hole_id. This isn't
            the desired constraints. Constraints here should be on contest_id, hole_id and course_is all
            defined in the junction table jt_holes_contests declared by courseHolesContests
        */
        unique: false,
    },
    foreignKey: 'contest_id',
    otherKey: 'hole_id',
    // onDelete: 'CASCADE',
});

/*  To allow nested includes through the junction tables, define intermediary associations:
    ref: 
    https://sequelize.org/docs/v6/advanced-association-concepts/advanced-many-to-many/
    also google ai by searching:
    'sequelize js link junction table used in association in another association and include in query'
*/
// For Courses -> CourseHoles -> Holes
db.courses.hasMany(db.courseHoles, { as: 'CourseHoles', foreignKey: 'course_id' });
db.courseHoles.belongsTo(db.courses, { as: 'Course', foreignKey: 'course_id' });
db.courseHoles.belongsTo(db.holes, { as: 'Hole', foreignKey: 'hole_id' });

// For Holes -> HoleContests -> Contests
db.holes.hasMany(db.courseHolesContests, { as: 'HoleContests', foreignKey: 'hole_id' });
db.courseHolesContests.belongsTo(db.holes, { as: 'Hole', foreignKey: 'hole_id' });
db.courseHolesContests.belongsTo(db.contests, { as: 'Contest', foreignKey: 'contest_id' });

// ManyToMany relationship between staff and authorities
db.staff.belongsToMany(db.staffAuths, { 
    onDelete: 'CASCADE',
    through: db.tblJoinStaffAuths,
    foreignKey: 'staff_id',
    otherKey: 'auth_id'
});
db.staffAuths.belongsToMany(db.staff, { 
    through: db.tblJoinStaffAuths,
    foreignKey: 'auth_id',
    otherKey: 'staff_id'
});

db.connect = async () => {
    try {
        await sequelize.authenticate();
        /*  This checks what is the current state of the table in the database (which columns it has, what are their data types, etc), 
            and then performs the necessary changes in the table to make it match the model.
        */
        // await sequelize.sync( { alter: true } );
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = db;