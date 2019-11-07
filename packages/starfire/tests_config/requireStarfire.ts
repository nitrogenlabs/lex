const isProduction = process.env.NODE_ENV === 'production';
const starfireRootDir = isProduction ? process.env.STARFIRE_DIR : '../';

module.exports = require(starfireRootDir);
