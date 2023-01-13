const ping = require('ping');
const userService = require('../service/user-service');
const db = require('../../db');

class LatencyController{
    async getPing(req, res, next){
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const { refreshToken } = req.cookies;
            const userData = await userService.refreshToken(client, refreshToken);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 2592000000, httpOnly: true });
            const result = await ping.promise.probe('www.google.com');
            await client.query('COMMIT');
            return res.json({result, userData});
        } catch (error) {
            await client.query('ROLLBACK');
            return next(error);
        } finally {
            client.release();
        }
    }
}

module.exports = new LatencyController();