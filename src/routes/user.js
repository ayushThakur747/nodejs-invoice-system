const express = require('express');
const {signin,initialilizing,createUser,getUsers,updateUser} = require('../controllers/users')
const {auth,authRole,authUpdateUser} = require('../middleware/auth');
const router = express.Router();


router.post('/signin',signin);
router.post('/createUser/:role',auth,authRole,createUser);
router.get('/users',auth,getUsers);
router.patch('/:id',auth,authUpdateUser,updateUser)//change /updateuser/:id
module.exports = router