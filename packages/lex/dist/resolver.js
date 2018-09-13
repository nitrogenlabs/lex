var fs = require('fs');
var path = require('path');
var resolve = require('resolve');
module.exports = function (value, options) {
    if (value === '') {
        return null;
    }
    var basedir = options.basedir, extensions = options.extensions;
    var hasBase = value.indexOf('./') >= 0 || value.indexOf('../') >= 0;
    if (hasBase) {
        var existingExt = path.extname(value) || '';
        if (existingExt !== '' && extensions.includes(existingExt)) {
            return path.resolve(basedir + "/" + value);
        }
        var fullPath_1 = value;
        extensions.some(function (ext) {
            var filename = path.resolve(basedir + "/" + value + ext);
            if (fs.existsSync(filename)) {
                fullPath_1 = filename;
                return true;
            }
            var indexFile = path.resolve(basedir + "/" + value + "/index" + ext);
            if (fs.existsSync(indexFile)) {
                fullPath_1 = indexFile;
                return true;
            }
            return false;
        });
        return fullPath_1;
    }
    try {
        return resolve.sync(value, { basedir: __dirname + "/../", extensions: extensions });
    }
    catch (error) {
        try {
            return resolve.sync(value, { basedir: process.cwd(), extensions: extensions });
        }
        catch (error) {
            return null;
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFFbkMsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFDLEtBQUssRUFBRSxPQUFPO0lBQzlCLElBQUcsS0FBSyxLQUFLLEVBQUUsRUFBRTtRQUNmLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFTSxJQUFBLHlCQUFPLEVBQUUsK0JBQVUsQ0FBWTtJQUN0QyxJQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUV0RSxJQUFHLE9BQU8sRUFBRTtRQUNWLElBQU0sV0FBVyxHQUFXLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRXRELElBQUcsV0FBVyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3pELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBSSxPQUFPLFNBQUksS0FBTyxDQUFDLENBQUM7U0FDNUM7UUFFRCxJQUFJLFVBQVEsR0FBRyxLQUFLLENBQUM7UUFFckIsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFDLEdBQUc7WUFDbEIsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBSSxPQUFPLFNBQUksS0FBSyxHQUFHLEdBQUssQ0FBQyxDQUFDO1lBRTNELElBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDMUIsVUFBUSxHQUFHLFFBQVEsQ0FBQztnQkFDcEIsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUksT0FBTyxTQUFJLEtBQUssY0FBUyxHQUFLLENBQUMsQ0FBQztZQUVsRSxJQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQzNCLFVBQVEsR0FBRyxTQUFTLENBQUM7Z0JBQ3JCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxVQUFRLENBQUM7S0FDakI7SUFFRCxJQUFJO1FBQ0YsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFDLE9BQU8sRUFBSyxTQUFTLFNBQU0sRUFBRSxVQUFVLFlBQUEsRUFBQyxDQUFDLENBQUM7S0FDdkU7SUFBQyxPQUFNLEtBQUssRUFBRTtRQUNiLElBQUk7WUFDRixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxVQUFVLFlBQUEsRUFBQyxDQUFDLENBQUM7U0FDbEU7UUFBQyxPQUFNLEtBQUssRUFBRTtZQUNiLE9BQU8sSUFBSSxDQUFDO1NBQ2I7S0FDRjtBQUNILENBQUMsQ0FBQyJ9