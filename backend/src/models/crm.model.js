import mongoose from 'mongoose';

const CRMRecordSchema=new mongoose.Schema({

    importId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Import"
    },

    projectId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project"
    },

    created_at:String,

    name:String,

    email:String,

    country_code:String,

    mobile_without_country_code:String,

    company:String,

    city:String,

    state:String,

    country:String,

    lead_owner:String,

    crm_status:String,

    crm_note:String,

    data_source:String,

    possession_time:String,

    description:String

},{
    timestamps:true
})

export default mongoose.model("CRMRecord",CRMRecordSchema)