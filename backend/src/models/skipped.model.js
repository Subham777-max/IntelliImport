import mongoose from 'mongoose';
const SkippedRecordSchema=new mongoose.Schema({

    importId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Import"
    },

    projectId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project"
    },

    originalRecord:Object,

    reason:String

})

export default mongoose.model("SkippedRecord",SkippedRecordSchema)