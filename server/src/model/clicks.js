const mongoose=require('mongoose')

const clickSchema=new mongoose.Schema({
    linkID:{type:mongoose.Schema.Types.ObjectId, ref:"Links",required:true},
    ip:String,
    city:String,
    country:String,
    region:String,
    latitude:Number,
    longitude:Number,
    isp:String,
    referrer:String,
    useAgent:String,
    deviceType:String,
    browser:String,
    clickedAt:{type:Date,default:Date.now},
})

module.exports=mongoose.model("Clicks",clickSchema);