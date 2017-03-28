const mongoose = require('mongoose');
mongoose.connect('mongodb://172.23.238.158:27017/test');
module.exports = mongoose.connection;
