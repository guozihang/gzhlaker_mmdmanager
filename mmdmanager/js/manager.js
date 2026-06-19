function PathManager() {
    throw new Error('This is a static class');
}
PathManager.dataFileName = 'data.json'
PathManager.PROGRAMPATH = window.PROGRAMPATH;
PathManager.CONFIGPATH = window.CONFIGPATH || window.PROGRAMPATH;
PathManager.DATAPATH = path.join(PathManager.PROGRAMPATH, 'data') + path.sep;
PathManager.SOFTPATH = path.join(PathManager.PROGRAMPATH, 'software') + path.sep;
PathManager.PROJECTPATH = path.join(PathManager.PROGRAMPATH, 'project') + path.sep;
PathManager.MODELPATH = path.join(PathManager.DATAPATH, 'Model') + path.sep;
PathManager.MMEPATH = path.join(PathManager.DATAPATH, 'MME') + path.sep;
PathManager.SCENEPATH = path.join(PathManager.DATAPATH, 'Scene') + path.sep;
PathManager.VMDPATH = path.join(PathManager.DATAPATH, 'Vmd') + path.sep;
PathManager.GAMEPATH = path.join(PathManager.DATAPATH, 'Game') + path.sep;
PathManager.getDataPath = function(){
    return PathManager.DATAPATH;
}
PathManager.getDataFullPath = function(){
    return PathManager.CONFIGPATH + path.sep + PathManager.dataFileName;
}


function DataManager() {
    throw new Error('This is a static class');
}
DataManager.MODELS = GetDirsAllData(PathManager.MODELPATH)
DataManager.SCENE = GetDirsAllData(PathManager.SCENEPATH)
DataManager.MMES = GetDirsAllData(PathManager.MMEPATH)
DataManager.VMDS = GetDirsAllData(PathManager.VMDPATH)
DataManager.GAMES = GetDirsAllData(PathManager.VMDPATH)