const preAuthorize = (...allowedAuthorities) => {
    return (req, res, next) => {
        if(!req?.whom?.roles) {
            return res.sendStatus(403); //  Forbidden
        }
        const rolesArr = [...allowedAuthorities];
        const result = req.whom.roles.map(role => rolesArr.includes(role)).find(val => val === true);
        if(!result) {
            return res.sendStatus(403); // Forbidden
        }
        next();
    }
}

module.exports = preAuthorize;