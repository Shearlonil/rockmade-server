const express = require('express');
const router = express.Router();

const { verifyAccessToken } = require('../middleware/jwt');
const validate = require('../middleware/schemer-validator');

router.route('/groups/players/swap').put( verifyAccessToken );

module.exports = router;