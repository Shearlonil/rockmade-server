const preAuthorize = (...allowedAuthorities) => {
    return (req, res, next) => {
        if(!req?.whom?.roles) {
            return res.sendStatus(401); //  Unauthorized
        }
        const rolesArr = [...allowedAuthorities];
        const result = req.whom.roles.map(role => rolesArr.includes(role)).find(val => val === true);
        if(!result) {
            return res.sendStatus(401); // Unauthorized
        }
        next();
    }
}

module.exports = preAuthorize;