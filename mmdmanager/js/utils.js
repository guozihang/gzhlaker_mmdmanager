var GetDirsAllData = function(path){
    let mData = {}
    /*
     * 获取当前文件架下的所有子文件夹和文件
     */
    fs.exists(path, function(exists){
        if(exists == true){
            let mLevel1All = []
            let mLevel1Dir = []
            let mLevel1File = []
            let mLevel1FileSuffix = {}
            /*
             * 分类
             */
            for (let mIndex = 0, mData = fs.readdirSync(path); mIndex < mData.length; mIndex++) {
                let temp = {}
                temp.id = mIndex
                temp.name = mData[mIndex]
                temp.path = path + mData[mIndex]
                mLevel1All.push(temp)
            }
            /*
             * 区别文件夹与文件
             */
            for (let mIndex = 0; mIndex < mLevel1All.length; mIndex++) {
                if(fs.statSync(mLevel1All[mIndex].path).isDirectory){
                    var temp = {}
                    temp.id = mLevel1Dir.length
                    temp.name = mLevel1All[mIndex].name
                    temp.path = mLevel1All[mIndex].path + '\\'
                    mLevel1Dir.push(temp)
                }
                else if(fs.statSync(mLevel1All[mIndex].path).isFile){
                    let temp = {}
                    temp.id = mLevel1File.length
                    temp.name = mLevel1All[mIndex].name
                    temp.path = mLevel1All[mIndex].path
                    mLevel1File.push(temp)
                }
            }
            /*
             * 获取每个子文件夹的内容
             */
            //console.log(mLevel1All)
            //console.log(mLevel1Dir)
            //console.log(mLevel1File)
            for (let mIndex = 0; mIndex < mLevel1Dir.length; mIndex++) {
                //console.log(mLevel1Dir[mIndex].path)
                mLevel1Dir[mIndex].subs = GetDirsAllData(mLevel1Dir[mIndex].path)
            }

            mData.all = mLevel1All
            mData.dir = mLevel1Dir
            mData.file = mLevel1File
        }
    })
    //console.log(mData)
    return mData
    
}