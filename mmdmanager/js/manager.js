function PathManager() {
    throw new Error('This is a static class');
}
PathManager.dataFileName = 'data.json'
PathManager.PROGRAMPATH = path.dirname(process.execPath);
PathManager.DATAPATH = PathManager.PROGRAMPATH + '\\data\\';
PathManager.SOFTPATH = PathManager.PROGRAMPATH + '\\software\\'
PathManager.PROJECTPATH = PathManager.PROGRAMPATH + '\\project\\'
PathManager.MODELPATH = PathManager.DATAPATH + 'Model\\';
PathManager.MMEPATH = PathManager.DATAPATH + 'MME\\';
PathManager.SCENEPATH = PathManager.DATAPATH + 'Scene\\';
PathManager.VMDPATH = PathManager.DATAPATH + 'Vmd\\';
PathManager.GAMEPATH = PathManager.DATAPATH + 'Game\\';
PathManager.getDataPath = function(){
    return PathManager.DATAPATH;
}
PathManager.getDataFullPath = function(){
    return PathManager.DATAPATH + PathManager.dataFileName;
}


function DataManager() {
    throw new Error('This is a static class');
}
DataManager.MODELS = GetDirsAllData(PathManager.MODELPATH)
DataManager.SCENE = GetDirsAllData(PathManager.SCENEPATH)
DataManager.MMES = GetDirsAllData(PathManager.MMEPATH)
DataManager.VMDS = GetDirsAllData(PathManager.VMDPATH)
DataManager.GAMES = GetDirsAllData(PathManager.VMDPATH)