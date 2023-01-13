const ApiError = require('../exceptions/api-error');
const { validationResult } = require('express-validator');
const validatorService = require('../service/validator-service');
const validator = require('validator');
const userService = require('../service/user-service');
const db = require('../../db');

class UserController{
    static maxAge = 2592000000; // 2592000000 ms = 30 days

    async signup(req, res, next){
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const {name, password, isEmail} = req.body;
            if(isEmail && !validator.isEmail(name)){
                throw ApiError.BadRequest('Неправильный адрес электронной почты');
            }else if(!/^\d{10}$/.test(name)){
                throw ApiError.BadRequest('Неправильный номер телефона');
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const result = await validatorService.errorHandler(errors.array());
                return result;
            }
            
            const userData = await userService.signup(client, name, password, isEmail);
            await client.query('COMMIT');
            return res.json(userData);
        } catch (error) {
            await client.query('ROLLBACK');
            return next(error);
        } finally {
            client.release();
        }
    }
    async signin(req, res, next){
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const {name, password} = req.body;
            const userData = await userService.signin(client, name, password);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: UserController.maxAge, httpOnly: true });
            await client.query('COMMIT');
            return res.json(userData);
        } catch (error) {
            await client.query('ROLLBACK');
            return next(error);
        } finally {
            client.release();
        }
    }
    async logout(req, res, next){
        const client = await db.connect();
        try {
            const { all } = req.params;
            const { refreshToken } = req.cookies;

            // /logout [GET] - с паметром all:
            //true - удаляет все bearer токены пользователя
            //false - удаляет только текущий bearer токен.
            // /logout [GET запрос без параметров] - удаляет (или заносит в черный список) токен пользователя

            if(+all){// не совсем понимаю для чего этот параметр
                await client.query('BEGIN');
                const token = await userService.logout(client, refreshToken);
                await client.query('COMMIT');
                return res.json(token);
            }
            res.clearCookie('refreshToken');
            return res.json();
        } catch (error) {
            await client.query('ROLLBACK');
            return next(error);
        } finally {
            client.release();
        }
    }

    async userInfo(req, res, next){
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const { refreshToken } = req.cookies;
            const userData = await userService.refreshToken(client, refreshToken);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 2592000000, httpOnly: true });
            await client.query('COMMIT');
            return res.json({userData});
        } catch (error) {
            await client.query('ROLLBACK');
            return next(error);
        } finally {
            client.release();
        }
    }
}

module.exports = new UserController();