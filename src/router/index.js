const { Router } = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user-controller');
const latencyController = require('../controllers/latency-controller');
const authMiddleware = require('../middlewares/auth-middleware');

const router = new Router();
router.post('/signup', body('password').isLength({ min: 8, max: 32 }), userController.signup);
router.post('/signin', userController.signin);
router.get('/logout/:all', userController.logout);
router.get('/info', authMiddleware, userController.userInfo);
router.get('/latency', authMiddleware, latencyController.getPing);

module.exports = router;
