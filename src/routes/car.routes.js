const { Router } = require('express');
const { crearAuto, obtenerCoches, eliminarAuto } = require('../controllers/car.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = Router();

router.use(autenticar);

router.post('/', crearAuto);
router.get('/', obtenerCoches);
router.delete('/:id', eliminarAuto);

module.exports = router;
