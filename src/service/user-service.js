const bcrypt = require('bcrypt');
const tokenService = require('./token-service');
const ApiError = require('../exceptions/api-error');

class UserService {
    async signup(client, username, password, isEmail) {
        const candidate = await client.query('SELECT id FROM public.user WHERE name = $1', [username]);
        if (candidate.rows.length) {
            throw ApiError.BadRequest('Пользователь уже существует');
        }
        const hashPassword = await bcrypt.hash(password, 3);
        const user = await client.query('INSERT INTO public.user (name, password, is_email) VALUES ($1, $2, $3) RETURNING *', [username, hashPassword, isEmail]);
        const {id, name, is_email} = user.rows[0];
        return {userData: { id, name, is_email }};
    }
    async signin(client, username, pass) {
        const user = await client.query('SELECT id, name, is_email, password FROM public.user WHERE name = $1', [username]);
        if (!user.rows.length) {
            throw ApiError.BadRequest('Пользователь не найден');
        }
        const {id, name, is_email, password} = user.rows[0];
        const isPassEquals = await bcrypt.compare(pass, password);
        if (!isPassEquals) {
            throw ApiError.BadRequest('Пользователь не найден');
        }

        const tokens = tokenService.generateTokens({ id, name, is_email });
        await tokenService.saveToken(client, id, tokens.refreshToken);
        return {...tokens};
    }
    async logout(client, refreshToken) {
        const token = await tokenService.removeToken(client, refreshToken);
        return token;
    }
    
    async refreshToken(client, refreshToken) {
        if (!refreshToken) {
            throw new ApiError.UnauthorizedError();
        }
        const userTokenData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(client, refreshToken);

        if (!userTokenData || !tokenFromDb) {
            throw new ApiError.UnauthorizedError();
        }
        const user = await client.query('SELECT u.id, u.name, u.is_email FROM public.user u INNER JOIN token t ON t.user_id = u.id AND t.refresh_token = $1', [refreshToken]);
        const {id, name, is_email} = user.rows[0];

        const tokens = tokenService.generateTokens({ id, name, is_email });
        await tokenService.saveToken(client, id, tokens.refreshToken);

        return {
            ...tokens,
            userData: { id, name, is_email },
        };
    }
}

module.exports = new UserService();
