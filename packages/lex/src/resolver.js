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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXNvbHZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUVuQyxNQUFNLENBQUMsT0FBTyxHQUFHLFVBQUMsS0FBSyxFQUFFLE9BQU87SUFDOUIsSUFBRyxLQUFLLEtBQUssRUFBRSxFQUFFO1FBQ2YsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVNLElBQUEseUJBQU8sRUFBRSwrQkFBVSxDQUFZO0lBQ3RDLElBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXRFLElBQUcsT0FBTyxFQUFFO1FBQ1YsSUFBTSxXQUFXLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFdEQsSUFBRyxXQUFXLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDekQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFJLE9BQU8sU0FBSSxLQUFPLENBQUMsQ0FBQztTQUM1QztRQUVELElBQUksVUFBUSxHQUFHLEtBQUssQ0FBQztRQUVyQixVQUFVLENBQUMsSUFBSSxDQUFDLFVBQUMsR0FBRztZQUNsQixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFJLE9BQU8sU0FBSSxLQUFLLEdBQUcsR0FBSyxDQUFDLENBQUM7WUFFM0QsSUFBRyxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUMxQixVQUFRLEdBQUcsUUFBUSxDQUFDO2dCQUNwQixPQUFPLElBQUksQ0FBQzthQUNiO1lBRUQsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBSSxPQUFPLFNBQUksS0FBSyxjQUFTLEdBQUssQ0FBQyxDQUFDO1lBRWxFLElBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDM0IsVUFBUSxHQUFHLFNBQVMsQ0FBQztnQkFDckIsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLFVBQVEsQ0FBQztLQUNqQjtJQUVELElBQUk7UUFDRixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUMsT0FBTyxFQUFLLFNBQVMsU0FBTSxFQUFFLFVBQVUsWUFBQSxFQUFDLENBQUMsQ0FBQztLQUN2RTtJQUFDLE9BQU0sS0FBSyxFQUFFO1FBQ2IsSUFBSTtZQUNGLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFVBQVUsWUFBQSxFQUFDLENBQUMsQ0FBQztTQUNsRTtRQUFDLE9BQU0sS0FBSyxFQUFFO1lBQ2IsT0FBTyxJQUFJLENBQUM7U0FDYjtLQUNGO0FBQ0gsQ0FBQyxDQUFDIn0=