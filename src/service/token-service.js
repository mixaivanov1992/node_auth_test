const jwt = require('jsonwebtoken');

class TokenService {
    generateTokens(payload) {
        const accessToken = jwt.sign(payload, '2zvrR3po1P9JghmssXw3xxm7R4KuPwPx8i6xevLo', { expiresIn: '10m' }); //вынести в env
        const refreshToken = jwt.sign(payload, 'wpcs9SG4JZqZ2ukFJOhIolSEwWsLJVZJzjhdkT7e', { expiresIn: '30d' });//вынести в env
        return {
            accessToken,
            refreshToken,
        };
    }

    async saveToken(client, userId, refreshToken) {
        const tokenData = await client.query('SELECT id FROM public.token WHERE user_id = $1', [userId]);
        if (tokenData.rows.length) {
            const token = await client.query('UPDATE public.token SET refresh_token = $1 WHERE user_id = $2 RETURNING *', [refreshToken, userId]);
            return token;
        }
        const token = await client.query('INSERT INTO public.token (refresh_token, user_id) VALUES ($1, $2) RETURNING *', [refreshToken, userId]);
        return token;
    }

    async removeToken(client, refreshToken) {
        const token = await client.query('DELETE FROM public.token WHERE refresh_token = $1 RETURNING *', [refreshToken]);
        return token?.rows[0];
    }

    validateAccessToken(token) {
        try {
            const userData = jwt.verify(token, '2zvrR3po1P9JghmssXw3xxm7R4KuPwPx8i6xevLo');
            return userData;
        } catch (error) {
            return null;
        }
    }

    validateRefreshToken(token) {
        try {
            const userData = jwt.verify(token, 'wpcs9SG4JZqZ2ukFJOhIolSEwWsLJVZJzjhdkT7e');
            return userData;
        } catch (error) {
            return null;
        }
    }
    async findToken(client, refreshToken) {
        const token = await client.query('SELECT id FROM public.token WHERE refresh_token = $1', [refreshToken]);
        return token?.rows.length;
    }
}

module.exports = new TokenService();
