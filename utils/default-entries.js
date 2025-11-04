module.exports = {
    // ref: https://www.prospects.ac.uk/jobs-and-work-experience/job-sectors
    bora: {
        fname: "Ibrahim",
        lname: "Adubi",
        phone: "08034262759",
        email: "shearlonil@gmail.com",
        sex: "M",
        acc_creator: 1,
    },
    // 100 series => users/staff
    // 300 series => clients
    // 400 series => miscellaneous
    authorities: {
        activateDeactiveteAccount: {
            name: "Activate/Deactivate Accounts",
            code: 100,
            desc: "Ability to activate/deativate company staff accounts",
        },
        addStaffAccount: {
            name: "Add Staff Accounts",
            code: 101,
            desc: "Ability to add company staff accounts",
        },
        updateStaffRoles: {
            name: "Update Staff Roles",
            code: 102,
            desc: "Ability to add/remove staff roles/authorities",
        },
        viewStaff: {
            name: "View Registered Users",
            code: 103,
            desc: "View all registered staff accounts",
        },
        staffSearch: {
            name: "Staff Search",
            code: 104,
            desc: "Search Staff by ID or Email",
        },
        viewClients: {
            name: "View Clients",
            code: 300,
            desc: "View client accounts. View unverified email addresses",
        },
        activateDeactivateClients: {
            name: "Activate/Deactivate Clients",
            code: 301,
            desc: "Activating/Deativating client accounts",
        },
        clientSearch: {
            name: "Client Search",
            code: 302,
            desc: "Search Clients (Golfers) by id or email",
        },
        sendNotifications: {
            name: "Send Notifications",
            code: 400,
            desc: "Send notifications when required",
        },
        updateTermsAndAgreement: {
            name: "Update Terms and Agreement",
            code: 406,
            desc: "Updating Terms and Agreement",
        },
    },
};
