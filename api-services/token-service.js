const db = require('../config/entities-config');

const RefreshToken = db.refreshTokens;

// ref: https://www.youtube.com/watch?v=oKDxIqYfjYY&t=472s

const addToken = async data => {
    await RefreshToken.create({ user_id: data.user_id, user_type: data.user_type, token: data.token });
};

const removeToken = async token => {
    await RefreshToken.destroy({
        where: {
            token
        }
    });
};

// for removing all associated tokens attached to a particular user..... signing out all devices
const removeAllTokens = async token => {
    const userToken = await RefreshToken.findOne({
        where: {
            token,
        }
    });
    if(userToken){
        await RefreshToken.destroy({
            where: {
                user_id: userToken.user_id
            }
        });
    }
};

const findToken = async token => {
    return await RefreshToken.findOne({
        where: {
            token
        }
    });
};

const findUserToken = async (user_id, user_type) => {
    return await RefreshToken.findOne({
        where: {
            user_id,
            user_type
        }
    });
};

module.exports = {
    addToken,
    removeToken,
    removeAllTokens,
    findToken,
    findUserToken,
};