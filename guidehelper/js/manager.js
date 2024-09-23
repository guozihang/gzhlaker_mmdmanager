function PathManager() {
    throw new Error('This is a static class');
}
console.log(window.process.cwd())
console.log(path.dirname(process.execPath))
PathManager.dataFileName = 'data.json'
PathManager.PROGRAMPATH = path.dirname(process.execPath);
PathManager.DATAPATH = PathManager.PROGRAMPATH + '\\data\\';
PathManager.GAMEPATH = PathManager.DATAPATH;
PathManager.getDataPath = function(){
    return PathManager.DATAPATH;
}
PathManager.getDataFullPath = function(){
    return PathManager.DATAPATH + PathManager.dataFileName;
}