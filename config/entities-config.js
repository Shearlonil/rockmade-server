const { Sequelize } = require('sequelize');
const sequelize = require('./sequelize-db-connect');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require('../entities/users')(sequelize, Sequelize);
db.blurHash = require('../entities/client_blurhash')(sequelize, Sequelize);
db.courses = require('../entities/courses')(sequelize, Sequelize);
db.games = require('../entities/games')(sequelize, Sequelize);
db.holes = require('../entities/holes')(sequelize, Sequelize);
db.contests = require('../entities/contests')(sequelize, Sequelize);
db.tblJoinHolesContests = require('../entities/tbl-join-holes-contests')(sequelize, Sequelize, db.holes, db.contests);
db.userGameGroup = require('../entities/user-game-group')(sequelize, Sequelize);
db.gameHoleRecords = require('../entities/game-hole-records')(sequelize, Sequelize);
db.holeContests = require('../entities/hole-contests')(sequelize, Sequelize);
db.holeScores = require('../entities/hole-scores')(sequelize, Sequelize);
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

// OneToOne relationship between client and their dp's (if any) blurhash
db.users.hasOne(db.blurHash, {
    onDelete: 'CASCADE',
    foreignKey: {
        name: 'user_id',
        allowNull: false
    }
});
db.blurHash.belongsTo(db.users, {
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

// OneToMany relationship between courses and holes
db.courses.hasMany(db.holes, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'course_id',
        allowNull: false,
    }
});
db.holes.belongsTo(db.courses, {
    foreignKey: {
        name: 'course_id',
        allowNull: false,
    }
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

// OneToMany relationship between gameHoleRecords and holeContest
db.gameHoleRecords.hasMany(db.holeContests, {
    foreignKey: {
        // also set the foreign key name here to avoid sequelize adding column CourseId
        name: 'game_hole_rec_id',
        allowNull: false,
    }
});
db.holeContests.belongsTo(db.gameHoleRecords, {
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

// ManyToMany relationship between users and games (using groups as user must be in a group to play a game)
db.users.belongsToMany(db.games, {
    as: 'game',
    through: db.userGameGroup,
    foreignKey: 'user_id',
    otherKey: 'game_id',
    onDelete: 'CASCADE',
});
db.games.belongsToMany(db.users, {
    as: 'user',
    through: db.userGameGroup,
    foreignKey: 'game_id',
    otherKey: 'user_id',
});

// ManyToMany relationship between contests and holes
db.contests.belongsToMany(db.holes, {
    as: 'hole',
    through: db.tblJoinHolesContests,
    foreignKey: 'contest_id',
    otherKey: 'hole_id',
    onDelete: 'CASCADE',
});
db.holes.belongsToMany(db.contests, {
    as: 'contest',
    through: db.tblJoinHolesContests,
    foreignKey: 'hole_id',
    otherKey: 'contest_id',
});

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