const ApiError = require('../exceptions/api-error');

class ValidatorService {
    async errorHandler(errors) {
        if (errors.length) {
            if (errors[0].param === 'password') {
                throw ApiError.BadRequest('Неправильный пароль');
            }
        }
        throw ApiError.BadRequest('Ошибка валидации');
    }
}

module.exports = new ValidatorService();
