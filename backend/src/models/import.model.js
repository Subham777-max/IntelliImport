import mongoose from 'mongoose';
const ImportSchema = new mongoose.Schema({

    projectId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project",
        required:true
    },

    fileName:String,

    status:{
        type:String,
        enum:["processing","completed","failed"],
        default:"processing"
    },

    totalRows:{
        type:Number,
        default:0
    },

    importedRows:{
        type:Number,
        default:0
    },

    skippedRows:{
        type:Number,
        default:0
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

})

export default mongoose.model("Import",ImportSchema)